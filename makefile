.PHONY: test clean

target/read-russian.zip: test target 
	zip -FSr $@ read-russian/ -x "read-russian/js/test/*" "read-russian/js/node_modules/*" "read-russian/js/package.json" "read-russian/data/*"

target:
	mkdir $@

clean:
	rm -rf target/*

test:
	npm test --prefix read-russian/js
