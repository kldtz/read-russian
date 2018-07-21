.PHONY: test 

target/read-russian.zip: target 
	zip -FSr target/read-russian.zip read-russian/ -x "read-russian/js/test/*" -x "read-russian/js/node_modules/*" -x "read-russian/js/package.json"

target:
	mkdir target

test:
	npm test --prefix read-russian/js
