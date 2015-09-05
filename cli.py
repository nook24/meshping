#!/usr/bin/python
# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import sys
import json
import socket

from optparse import OptionParser
from select   import select

def main():
    parser = OptionParser(usage="Usage: %prog [options] -- no options = list without reset")

    parser.add_option("-q", "--quiet",    help="No output",        default=False, action="store_true")
    parser.add_option("-r", "--reset",    help="Reset statistics", default=False, action="store_true")
    parser.add_option("-d", "--delete",   help="remove target",    default=False, action="store_true")
    parser.add_option("-a", "--add",      help="add target",       default=False, action="store_true")
    parser.add_option("-t", "--name",     help="target name",      default="")
    parser.add_option("-T", "--address",  help="target address",   default="")
    parser.add_option("-i", "--interval", help="ping interval",    type=int, default=1)

    options, posargs = parser.parse_args()

    ctrl = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.SOL_UDP)

    if options.add:
        opts = {
            "cmd":    "add",
            "itv":    options.interval,
        }
        if options.name:
            opts["name"] = options.name
        if options.address:
            opts["addr"] = options.address
        ctrl.sendto(json.dumps(opts), ("127.0.0.1", 55432) )

    elif options.delete:
        opts = {
            "cmd":    "remove",
            "itv":    options.interval,
        }
        if options.name:
            opts["name"] = options.name
        if options.address:
            opts["addr"] = options.address
        ctrl.sendto(json.dumps(opts), ("127.0.0.1", 55432) )

    else:
        ctrl.sendto( json.dumps({
            "cmd":    "list",
            "reset":  options.reset,
        }), ("127.0.0.1", 55432) )

    rdy_read, _, _ = select([ctrl], [], [], 0.5)
    if ctrl in rdy_read:
        reply, addr = ctrl.recvfrom(2**14)

        if not options.quiet:
            print json.dumps(json.loads(reply), indent=4)

    else:
        print "timeout, is meshping running?"


if __name__ == '__main__':
    sys.exit(main())
