.PHONY: all build

all: build

build: node_modules

dist: build src requirejs.conf.js tools
	mkdir -p dist
	./node_modules/requirejs/bin/r.js -o ./tools/build.conf.js	

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

server: build
	npm start

test: build
	npm test

clean:
	rm -rf node_modules lib dist

package: build

env=dev
deploy: dist
	./node_modules/.bin/lfcdn -e $(env)

