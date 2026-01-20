#!/bin/bash

# Open firewall port 3080 for TruGovAI Incident Tracker

PORT=3080

echo "Opening firewall port $PORT..."

# Try UFW (Ubuntu/Debian)
if command -v ufw &> /dev/null; then
    echo "Using UFW..."
    sudo ufw allow $PORT/tcp
    sudo ufw --force enable
    sudo ufw status
    echo "UFW: Port $PORT opened"
    exit 0
fi

# Try firewalld (CentOS/RHEL/Fedora)
if command -v firewall-cmd &> /dev/null; then
    echo "Using firewalld..."
    sudo firewall-cmd --permanent --add-port=$PORT/tcp
    sudo firewall-cmd --reload
    sudo firewall-cmd --list-ports
    echo "firewalld: Port $PORT opened"
    exit 0
fi

# Try iptables
if command -v iptables &> /dev/null; then
    echo "Using iptables..."
    sudo iptables -A INPUT -p tcp --dport $PORT -j ACCEPT
    # Save iptables rules (varies by distro)
    if command -v iptables-save &> /dev/null; then
        sudo iptables-save | sudo tee /etc/iptables.rules
    fi
    echo "iptables: Port $PORT opened"
    exit 0
fi

echo "ERROR: No firewall management tool found (ufw, firewall-cmd, or iptables)"
exit 1
