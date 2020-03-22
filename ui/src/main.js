var app = new Vue({
    el: '#app',
    data: {
        success_msg: "",
        last_update: 0,
        search: localStorage.getItem("meshping_search") || "",
        targets_all: [],
        targets_filtered: [],
        add_tgt_name: "",
        add_tgt_addr: "",
    },
    methods: {
        update_targets: async function () {
            var response = await this.$http.get('/api/targets');
            var json = await response.json();
            this.targets_all = json.targets;
            this.last_update = new Date();
            this.success_msg = "";
        },
        reapply_filters: function() {
            if( this.search === "" ){
                // Make a copy of the array, or else chrome goes 100% CPU in sort() :o
                this.targets_filtered = this.targets_all.slice();
            } else {
                var search = this.search.toLowerCase();
                this.targets_filtered = this.targets_all.filter(function(target){
                    return (
                        target.name.toLowerCase().indexOf(search) !== -1 ||
                        target.addr.indexOf(search) !== -1
                    );
                });
            }
            var ip_as_int = function(ipaddr) {
                if (ipaddr.indexOf(":") === -1) {
                    // IPv4
                    return (ipaddr
                        .split(".")
                        .map(x => parseInt(x, 10))
                        .reduce((acc, cur) => (acc <<  8n) | BigInt(cur), 0n)
                    );
                } else {
                    // IPv6
                    return (ipaddr
                        .split(":")
                        .map(x => parseInt(x, 16))
                        .reduce((acc, cur) => (acc << 16n) | BigInt(cur), 0n)
                    );
                }
            }
            this.targets_filtered.sort(function(a, b){
                return Number(ip_as_int(a.addr) - ip_as_int(b.addr));
            });
        },
        delete_target: async function(target) {
            var target_str = target.name + "@" + target.addr;
            var message = (
                "Delete target <target>?"
                    .replace("<target>", target_str)
            );
            if (confirm(message)) {
                var response = await this.$http.delete('/api/targets/' + target_str);
                var json = await response.json();
                if (json.success) {
                    this.success_msg = (
                        "<strong>Success!</strong> Deleted target " + target_str + ". " +
                        "It will disappear after the next ping cycle."
                    );
                }
            }
        },
        create_target: async function() {
            console.log([this.add_tgt_name, this.add_tgt_addr]);
            var target_str = this.add_tgt_name;
            if (this.add_tgt_addr !== "") {
                target_str += "@" + this.add_tgt_addr;
            }
            var response = await this.$http.post('/api/targets', {
                "target": target_str
            });
            var json = await response.json();
            if (json.success) {
                this.add_tgt_name = "";
                this.add_tgt_addr = "";
                this.success_msg = (
                    "<strong>Success!</strong> Added targets: <ul>" +
                      json.targets.map(tgt => "<li>" + tgt + "</li>").join("") +
                    "</ul>New targets will show up after the next ping cycle."
                );
            }
        }
    },
    created: function() {
        var self = this;
        window.setInterval(function(vue){
            if( new Date() - vue.last_update > 29500 ){
                vue.update_targets();
            }
        }, 1000, this);
        $(window).keydown(function(ev){
            if (ev.ctrlKey && ev.key === "f") {
                ev.preventDefault();
                $("#inpsearch").focus();
            }
            else if (ev.key === "Escape") {
                $("#inpsearch").blur();
                self.search = "";
            }
        });
    },
    watch: {
        search: function(search) {
            localStorage.setItem("meshping_search", search);
            this.reapply_filters();
        },
        targets_all: function() {
            this.reapply_filters();
        }
    }
});
