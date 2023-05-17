# Loading Content from USB with mmiLoader.py

## File Structure on USB:
Because the MMI primarily displays content as a flat list of items, it is best to 
```
/media/usb0/content
├── en
│   ├── Audio File Name and Source.mp3
│   ├── Audio Bible.mp3
│   ├── Video Title.mp4
│   ├── Jesus Film.mp4
│   ├── Descriptive-Name-For-Document.pdf
├── es
│   ├── Audio Bible.mp3
│   ├── Jesus Film.mp4
│   ├── Web Based Set of Commentaries
│   │   ├── index.html  (A web folder is known only because of index.html)
│   │   ├── images
│   │   ├── ...
│   │   ├── ...
├── ar
│   ├── Arabic Bible.epub
│   ├── Jesus Film.mp4
│   ├── Audio Bible
│   │   ├── 01-Genesis.mp3
│   │   ├── 02-Exodus.mp3
│   │   ├── 03-Leviticus.mp3
│   │   ├── 04-Numbers.mp3
├── tl (Not Recommended Structure)
│   ├── Audio Bible
│   │   ├── Genesis.mp3
│   │   ├── Exodus.mp3
│   │   ├── Leviticus.mp3
│   │   ├── Numbers.mp3
├── tl (Recommended Structure)
│   ├── Audio Bible
│   │   ├── 01-Genesis.mp3
│   │   ├── 02-Exodus.mp3
│   │   ├── 03-Leviticus.mp3
│   │   ├── 04-Numbers.mp3
├── amk  (Not Recommended Structure)
│   ├── Commentaries
│   │   ├── Commentary Set 1
│   │   │   ├── 01-Genesis.epub
│   │   │   ├── 02-Exodus.epub
│   │   │   ├── 03-Leviticus.epub
│   │   │   ├── 04-Numbers.epub
│   │   ├── Commentary Set 2
│   │   │   ├── 01-Genesis.epub
│   │   │   ├── 02-Exodus.epub
│   │   │   ├── 03-Leviticus.epub
│   │   │   ├── 04-Numbers.epub
│   │   ├── Commentary Set 3
│   │   │   ├── 01-Genesis.epub
│   │   │   ├── 02-Exodus.epub
│   │   │   ├── 03-Leviticus.epub
│   │   │   ├── 04-Numbers.epub
├── amk (Recommended Structure)
│   ├── Commentary Set 1
│   │   ├── 01-Genesis.epub
│   │   ├── 02-Exodus.epub
│   │   ├── 03-Leviticus.epub
│   │   ├── 04-Numbers.epub
│   ├── Commentary Set 2
│   │   ├── 01-Genesis.epub
│   │   ├── 02-Exodus.epub
│   │   ├── 03-Leviticus.epub
│   │   ├── 04-Numbers.epub
│   ├── Commentary Set 3
│   │   ├── 01-Genesis.epub
│   │   ├── 02-Exodus.epub
│   │   ├── 03-Leviticus.epub
│   │   ├── 04-Numbers.epub
```
#### Notes:
* Supported file types are listed [here](src/assets/templates/en/data/types.json)
* Best practice is to have language codes (2 or 3 letter -- [see list](src/assets/templates/languageCodes.json)) at the root level above `/media/usb0/content`.  If the directory name, matches a language code, or if the portion of the directory name prior to a <space> or a <dash> matches a language code, then the directory will be processed as a language.
* In example above, all are valid examples but not all preferred.
* In language en, each of the 5 files are treated as peer elements and will each be listed on the interface main page.
* In language es, there will be 3 items on the interface main page: the Bible, the film and the web site.
* In language tl, the Not Recommended structure will not correctly order the books of the Bible due to alphabetical ordering.  The Recommended structure using leading zeroes will put the books in the correct order.
* In language ar, there will be 3 items on the interface main page: the Bible, the film and the Audio Bible.  The difference is that the Audio Bible is set up as a collection, where each of the books of the Bible will be listed on a subpage, once the Audio Bible collection is clicked.  It is advantageous to use numbers with leading zeroes to have them be in alphabetical order.
* In language amk (Not Recommended), there will be just 1 item on the interface main page: a collection called Commentaries.  Inside will be a confusing mess because all of the files in the Commentaries collection will be mixed.  Thus, multiple levels of subfolders should be avoided.
* In language amk (Recommended), there will be 3 collections on the interface main page with each collection's epub books listed within.

## Web Directories
* Using web directories of existing web site content is a keen way to deliver web Content
* Because the Connectbox may not be always connected to the Internet, care should be used to ensure that no external libraries (Javascript, CSS, fonts) are required by the content.
* The main page of the web content should always be index.html
* Other files in web directories or sub directories will not be indexed other than as a part of the web directory.

## Video Thumbnails
The system will automatically generate thumbnails for the the videos.  This can take some time when indexing larger folder structures with many videos.

## Usage:
* Graphical Admin: After logging in to Connectbox's Admin Web Interface (Typically http://connectbox/admin), click on the button labeled: Load Content From USB Flash (/USB/package or /USB/content)
* Shell: As root, you can execute `/usr/local/connectbox/bin/mmiLoader.py`.  To fully execute with re-indexing, also remove the file `/media/usb0/content/saved.zip`  This will permit you to view all the logs in real time.
