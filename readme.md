## Introduction

*Disclaimer:*

In the scope of this document terms:

- `service`, `app`, `process` could be used interchangeably and mean single process service (e.g. nodejs app, postgres, etc)
- `system` and `project` could be used interchangeably and mean project as a whole

`infra` is intended to be used for the development of multi-process nodejs and frontend javascript systems.
Complete infrastructure configuration is described in `{dev.}docker-compose.yml` in project root directory.

## Service specification

- Each service has `Dockerfile` and `dev.Dockerfile` in root folder
- All sources are stored under `src` folder
- `package.json`, dockerfiles and other similar configs placed in root folder
- `npm run dev` is configured to launch service in development mode with various watchers
- `npm run prod` is configured to launch service in prod mode
- there is production service entry in system-wide `docker-compose.yml`
- there is dev service entry in system-wide `dev.docker-compose.yml`

## Types of services

Types of services are defined by label `infra.type` in `docker-compose.yml` file.
Available types are:

- api
- frontend
- postgres

Infra uses this meta information to generate some handy defaults.
E.g. If you generate `api-workframe` and you already have postgres set service
you will get `PG_HOST` initialized with name of postgres container.

## Shared codebase

Shared codebase directories used to share code between different services 
and implemented as:

- symlinks + volumes in `dev` mode
- symlink + directory copy in `prod` mode

it works like this:

- create symlink to shared directory in target service `src` directory
- update dockerfiles to copy shared files and install it's dependencies

shared folders are not services and don't have dockerfiles and entries in docker-compose configs.

```
usage: index.js <command>

Commands:
  index.js use <projectName>        set active project
  index.js dev <service>            start service in dev mode       [aliases: d]
  index.js cd [service]             Go to service source code directory
  index.js project                  manage projects           [aliases: proj, p]
  index.js service                  manage project services         [aliases: s]
  index.js generate                 generate services from templates[aliases: g]
  index.js work                     start workspace
  index.js migration <name>         create migration                [aliases: m]
  index.js state                    show infra current configuration
  index.js set-value <key> <value>  manually set config value using dot notation
  index.js reset-really-hard        reset infra configuration

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```
