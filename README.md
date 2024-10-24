
## Installation
```bash
$ yarn install
```

## Running the app
create ./environments/.env.local and put given variables in there

run services
```
start command yarn services:up
stop command yarn services:down
```

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test
create ./environments/.env.e2e for  testing
```bash
# e2e tests
$ yarn run test:e2e:local
```
