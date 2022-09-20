#!/bin/bash

# mimic tsup =)

start=`date +%s`

# basic helpers

prefix='PKG'

styled() {
	echo -e "\e[$1m$2\e[0m"
}

notify_text() {
	echo "$(styled 34 "$prefix") $1"
}

notify_file_result() {
	echo "$(styled 32 "$prefix") $(styled 1 "$1") $(styled 32 "$2")"
}

notify_success() {
	echo "$(styled 32 "$prefix") ⚡️ Build success in $((`date +%s` - start))ms"
}

# start the process

notify_text "Build start"

output_file="dist/package.json"

read -r -d '' package_json_text <<EOF
{
	"name": "yues-client",
	"version": "${1:1}",
	"main": "index.cjs",
	"module": "index.js",
	"license": "MIT",
	"engines" : {
		"node" : ">=18.0.0"
	}
}
EOF

echo "$package_json_text" > "$output_file"

notify_file_result "$output_file" "$(echo "$package_json_text" | wc -c) B"
notify_success
