## Introduction

*Disclaimer:*

In the scope of this document terms: `service`, `app`, `process` could be used interchangeably.

`infra` is intended to be used for the development of multi-process nodejs and frontend javascript systems.
Complete infrastructure configuration is described in `docker-compose.yml` in project root directory.

Roughly speaking there are 3 types of services:
	- nodejs app (could be some kind of api webserver or worker)
	- frontend app ([nuxtjs](https://nuxtjs.org) apps are preffered)
	- third-party apps (databases, queues, etc.)


```
usage: infra <command>

Commands:
  infra use <projectName>        set active project
  infra project                  manage projects              [aliases: proj, p]
  infra service                  manage project services            [aliases: s]
  infra work                     start workspace
  infra state                    show infra current configuration
  infra set-value <key> <value>  manually set config value using dot notation
  infra reset-really-hard        reset infra configuration

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## Service specification

- Each service has `Dockerfile` and `dev.Dockerfile` in root folder
- All sources are stored under `src` folder
- `package.json`, dockerfiles and other similar configs placed in root folder
- `npm run dev` is configured to launch service in development mode with various watchers
- `npm run prod` is configured to launch service in prod mode

## Types of services

Types of services are defined by label `infra.type` in docker-compose config file.
Available types are:

- api
- frontend
- postgres

Infra uses this meta information to generate some handy defaults.
E.g. If you generate `api-workframe` and you already have postgres set service
you will get `PG_HOST` initialized with name of postgres container.
