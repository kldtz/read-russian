.PHONY: test 

target/read-russian.zip: read-russian target 
	zip -FSr $@ read-russian/ -x "read-russian/js/test/*" "read-russian/js/node_modules/*" "read-russian/js/package.json" "read-russian/data/*"

target:
	mkdir $@

test:
	npm test --prefix read-russian/js
