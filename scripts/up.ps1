# Windows error on `docker-compose up`:
# Cannot start service api: Ports are not available: listen tcp 0.0.0.0:3000

# Restart Windows NAT service to free up all the goobled port ranges

Start-Process powershell -Verb runas
restart-service WinNat