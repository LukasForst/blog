install:
	(cd .codedoc && npm install)

build:
	codedoc build

serve:
	codedoc serve

clean:
	rm -rf dist