## About

Zero-overhead CLI tool for a better experience with `docker-compose`.

## Installation

```
npm i -g infra-for-docker-compose
```

## Example usage

This example is using short command aliases for convenience.

```
# Clone demo repo
git clone ...

# Add project
infra p add ./infra-demo

# start service (name is fuzzy-matched)
infra s s cons

# same as
infra service start consumer-api


# now you can edit sources
# and apps will autoreload (because of nodemon + volumes)


# show logs
infra s l cons

# connect to container via sh
infra s c cons

# connect to redis
infra s c redis

# stop all services
infra s d

# start service and attach to logs
infra s s adm -l 
```
