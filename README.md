# The OpenWell (MMI) - base design in open source


[![AppVersion-version](https://img.shields.io/badge/AppVersion-0.0.1-brightgreen.svg?style=flat)](https://github.com/delvedor/appversion?#version)

A multimedia interface designed for offline media boxes like the Connect Box.  There are at least two ways to populate the interface with content: (1) through packages created from [MediaBuilder](https://github.com/ConnectBox/mediabuilder) loaded from lazyLoader (see below) or (2) from semi-structured content located at /media/usb0/content which is typically on a USB drive attached to the device [Instructions](./mmiLoader.md).  

## Usage

Download the [latest code](https://github.com/RT-coding-team/mediainterface/releases/download/latest/latest.zip) and install the www directory as the root of the web server.  Browse to the web server and the default installed content (just a readme) should be viewable.  

MMI is meant to be used with the [MediaBuilder customized](https://github.com/RT-coding-team/mediabuilder) from Bolt CMS specifically for MMI.  Create content packages via MediaBuilder and create exporter zip files.  More information in MediaBuilder repo.  A package created from MediaBuilder should be unzipped and replaces the /src/assets/content directory (generally, you may want to remove the content directory then mv the zip file to /src/assets and execute `unzip <file.zip>`

In addition, the lazyLoader.py script in this repo can pull content provided as argument (example: `python /usr/local/connectbox/bin/lazyLoader.py https://yourmediabuilder/file.zip`) and the lazyLoader will unpack the zip, install it to the correct location (customize the location in the script) and load any needed media elements (typically from "slim" package created from MediaBuilder).

MMI can also be loaded using a script in the repo called mmiloader.py that will convert from a source directory (you can set the source and destination directories in the first few lines of the script).  Example on connectbox/thewell: `python /usr/local/connectbox/bin/mmiloader.py` and it will create a schema directory in the content directory of the MMI.

Default content is at src/assets/content and templates used by mmiloader.py are located at src/assets/templates.  The footer.html file can be customized.

## Development

This repository is following the branching technique described in [this blog post](http://nvie.com/posts/a-successful-git-branching-model/), and the semantic version set out on the [Semantic Versioning Website](http://semver.org/).  We use the [AppVersion](https://www.npmjs.com/package/appversion) library for managing the versioning of the app.

To add alias for paths, you need to add them to both the `tsconfig.json` file as well as the `config/webpack.config.ts` files.  See [here](https://medium.com/@siddhartha.ng/ionic-3-import-using-aliases-2aa260d6fab3) for more details.  You should also update the paths in `test-config/webpack.test.js`.

## Getting Started

Check out [wiki page](https://github.com/RT-coding-team/mediainterface/wiki) for more information on how to get started.

### Valuable Links

- [Importing Components](https://stackoverflow.com/a/53905947/4638563)
