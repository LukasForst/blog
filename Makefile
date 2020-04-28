install:
	(cd .codedoc && npm install)

build:
	codedoc build

server:
	codedoc serve

clean:
	rm -rf dist