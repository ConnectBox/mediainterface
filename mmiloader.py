#!/usr/bin/python3
#  Loads content from USB and creates the JSON / file structure for enhanced media interface


print ("loader: Starting...")

import json
import os
import pathlib
import shutil
import mimetypes

mimetypes.init()

#######################################################
def intersection(lst1, lst2):
    lst3 = [value for value in lst1 if value in lst2]
    return lst3

# Defaults for Connectbox / TheWell
mediaDirectory = "/media/usb0/content"
templatesDirectory = "/var/www/enhanced/content/www/assets/templates"
contentDirectory = "/var/www/enhanced/content/www/assets/content"
zipFileName = mediaDirectory + '/saved.zip';

# Init
mains = {}        # This object contains all the data to construct each main.json at the end.  We add as we go along
results = {}
results['totalInMediaDirectory'] = int(os.popen("find " + mediaDirectory + " -type f,l | wc -l").read().replace('\n',''))
results['processed'] = 0

# Clear the content directory so we replace it in whole and create the en directory for default
# Copy templates to content folder
try:
	os.system ("rm -r " + contentDirectory)
except:
	temp = 1 # There is a directory already

##########################################################################
#  See if this directory is language folder or content
##########################################################################
print ("	Check for saved.zip");
if (os.path.exists(mediaDirectory + "/saved.zip")):
	print ("	Found saved.zip.  Unzipping and restoring to " + contentDirectory);
	print (" ")
	print ("****If you want to reload the USB, delete the file saved.zip from the USB drive.");
	os.system ("mkdir " + contentDirectory)
	os.system ("(cd " + contentDirectory + " && unzip " + zipFileName + ")");
	print ("DONE");
	exit(0);

os.system ("mkdir " + contentDirectory)
shutil.copytree(templatesDirectory + '/en', contentDirectory + '/en')
shutil.copy(templatesDirectory + '/footer.html', contentDirectory)
shutil.copy(templatesDirectory + '/config.json', contentDirectory)
os.system ("chown -R www-data.www-data " + contentDirectory)   # REMOVE AFTER TEST
f = open (templatesDirectory + "/en/data/main.json")
mains["en"] = json.load(f)
os.system ("chmod -R 755 " + mediaDirectory)

# Retrieve languageCodes.json
f = open(templatesDirectory + '/languageCodes.json',)
languageCodes = json.load(f)

# Retrieve brand.txt
f = open('/usr/local/connectbox/brand.txt',)
brand = json.load(f)

# Sanity Checks
error = 0
try:
	if (len(brand['Brand']) < 5):
		throw();
	print ("Custom Branding: " + brand['Brand'])
except:
	brand['Brand'] = os.popen('cat /etc/hostname').read()
try:
	if (len(brand['Logo']) < 5):
		throw();
	print ("Custom Logo: " + brand['Logo'])
except:
	brand['Logo'] = "imgs/logo.png"

print ("Building Content For " + brand['Brand'])

# Insert Brand and Logo into the interface template.  We will write this at the end to each language
f = open (templatesDirectory + "/en/data/interface.json");   # We will always place USB content in EN language which is default
interface = json.load(f);
interface["APP_NAME"] = brand["Brand"]
interface["APP_LOGO"] = brand["Logo"]

# Load dictionary of file types
f = open (templatesDirectory + "/en/data/types.json");
types = json.load(f);
#print (types)

webpaths = []     # As we find web content, add here so we skip files and folders within

# Check for empty directory and write default content if empty
if len(os.listdir(mediaDirectory) ) == 0:
	print("Directory is empty")
	f = open(mediaDirectory + "/theopenwell.txt", "a")
	f.write("<h2>Media Directory Is Empty</h2>Please refer to documentation (placeholder).")
	f.close()


language = "en"  # By default but it will be overwritten if there are other language directories on the USB

##########################################################################
#  Check mediaDirectory for at least one language directory.  If one exists, then only process language folders
##########################################################################
doesRootContainLanguage = intersection(next(os.walk(mediaDirectory))[1],languageCodes)
if (doesRootContainLanguage):
  print ("Root Directory Contains Languages so we skip all root level folders that aren't languages: " + json.dumps(doesRootContainLanguage))

##########################################################################
#  Main Loop
##########################################################################
for path,dirs,files in os.walk(mediaDirectory, followlinks=True):
	thisDirectory = os.path.basename(os.path.normpath(path))
	relativePath = path.replace(mediaDirectory + '/', '').replace(language + '/','')
	print ("====================================================")
	print ("Evaluating Directory of Language (" + language + "): " + thisDirectory + " -> " + relativePath)
	shortPath = path.replace(mediaDirectory + '/d','')
	# These next two lines ignore directories and files that start with .
	files = [f for f in files if not f[0] == '_']
	dirs[:] = [d for d in dirs if not d[0] == '_']
	files = [f for f in files if not f[0] == '.']
	dirs[:] = [d for d in dirs if not d[0] == '.']
	dirs.sort()
	files.sort()


	directoryType = ''  	# Always start a directory with unknown
	skipWebPath = False;    # By default

	##########################################################################
	#  See if this directory is language folder or content
	##########################################################################

	print ('	Checking For Language Folder: '+ thisDirectory)
	try:
		if (os.path.isdir(mediaDirectory + '/' + thisDirectory) and mediaDirectory + '/' + thisDirectory == path):
			print ("	Directory is a valid language directory since it is in the root of the USB")
		else:
			fail() # This is a placeholder to trigger the try:except to have an exception that goes to except below
		print ('	Found Language: ' + json.dumps(languageCodes[thisDirectory]))
		language = thisDirectory
		directoryType = "language"
	except:
		print ('	NOT a Language: ' + thisDirectory)

	##########################################################################
	#  IF directory is not a language but we are ignoring non language root folders
	##########################################################################
	if (path == mediaDirectory and directoryType != "language" and doesRootContainLanguage):
		print ('	Skipping because directory is not a lanugage: ' + thisDirectory)
		continue;

	##########################################################################
	#  New language set up
	##########################################################################

	# See if the language already exists in the directory, if not make and populate a directory from the template
	if (not os.path.exists(contentDirectory + "/" + language)):
		print ("	Creating Directory: " + contentDirectory + "/" + language)
		shutil.copytree(templatesDirectory + '/en', contentDirectory + "/" + language)
		os.system ("chown -R www-data.www-data " + contentDirectory + "/" + language)
		# Load the main.json template and populate the mains for that language.
		f = open (templatesDirectory + "/en/data/main.json")
		mains[language] = json.load(f)

	##########################################################################
	#  See if this directory is skipped because it resides within a webPath for a web site content such as ./images or ./js
	##########################################################################

	for testPath in webpaths:
		if path.find(testPath) != -1:
			print ("	Skipping web path: " + path)
			skipWebPath = True
	if (skipWebPath):
		continue;

	##########################################################################
	#  Skip Directories with Characters we don't want
	##########################################################################
	if ("'" in thisDirectory):
		print ("	Directory contains invalid character: " + thisDirectory)
		continue

	##########################################################################
	#  If this directory is called images, skip because it's probably for html and we don't want to index this
	##########################################################################
	if (thisDirectory == 'images'):
		print ("	WebPath: Skipping images directory")
		webpaths.append(path)
		continue;

	##########################################################################
	#  If this directory contains html files then treat as web content and if it has no index file but is web, make an index file
	##########################################################################
	if ("'" in thisDirectory):
		print ("	Directory contains invalid character: " + thisDirectory)
		continue

	##########################################################################
	#  If this directory is called images, skip because it's probably for html and we don't want to index this
	##########################################################################
	if (thisDirectory == 'images'):
		print ("	WebPath: Skipping images directory")
		webpaths.append(path)
		continue;

	##########################################################################
	#  If this directory contains html files then treat as web content and if it has no index file but is web, make an index file
	##########################################################################
	#if (os.path.exists(path + "/index.html") or os.path.exists(path + "/index.htm")):
	if (int(os.popen("ls '" + path + "/'*.htm* 2>/dev/null | wc -l").read().replace('\n','')) > 0):
		print ("	" + path + " is HTML web content")
		if (os.path.exists(path + "/index.html")):
			print ("	WebPath: index file found")
		elif (os.path.exists(path + "/index.htm")):
			print ("	WebPath index.htm found -- symlink index.html to index.html")
			os.system ("ln -s '" + path + "/index.htm' '" + path + "/index.html'");
			files = []
			files.append("index.html")
		else:
			# This means we have no index but we will make one
			os.system ("tree '" + path + "' -H '.' -L 1 --noreport --charset utf-8 -P '*.htm*' | sed -e '/<hr>/,+7d' >" + path + "/index.html")
			print ("	WebPath: " + path + " is a web directory but doesn't have index file -- Creating an index of this folder")
			fullFilename = path + "/index.html"   # Rewrite this for indexing
			filename = "index.html"   # Rewrite this for indexing
			files = []
			files.append("index.html")
		# See if the language already exists in the directory, if not make and populate a directory from the template
		# Make a symlink to the file on USB to display the content
		print ("	WebPath: Writing symlink to /html folder")
		os.system ("ln -s '" + path + "' " + contentDirectory + "/" + language + "'/html/" + relativePath.replace('/','-') + "'")
		try:
			if (brand['makeArchive'] == True):
			  print ("	WebPath: Creating web archive zip file on USB")
			  shutil.make_archive(mediaDirectory + "/.webarchive-" + thisDirectory, 'zip', path)
			  print ("	WebPath: Linking web archive zip")
			  os.system ('ln -s "'+ mediaDirectory + '/.webarchive-' + thisDirectory + '.zip" "' + contentDirectory + "/" + language + "/html/" + thisDirectory + '.zip"')
		except:
			print ("	NOT making web archive according to brand.txt, makeArchive is not true");
		dirs = []
		print ("	WebPath: Set webpaths to true for this directory: " +thisDirectory)
		webpaths.append(path)
		directoryType = "html"

	##########################################################################
	#  Finish detecting directoryType (root, language, html, collection)
	##########################################################################
	if (path == mediaDirectory):
		directoryType = 'root'
	elif (directoryType == ''):
		directoryType = 'collection'

	print ("	Processing Directory: " + path)
	print ("	Processing Files According To directoryType = " + directoryType)
	print ("	--------------------------------------------------")

	# Now loop through each file
	for filename in files:
		print ("	--------------------------------------------------")
		print ("	Processing File: " + filename)

		##########################################################################
		#  Understand the  file being processed
		##########################################################################

		# Skip all files in a web path not named index.html because we just build an item for the index
		if (path in webpaths and "index.htm" not in filename):
			print ("	Webpath file " + filename + " is not index so skip")
			continue

		# Get certain data about the file and path
		fullFilename = path + "/" + filename							# Example /media/usb0/content/video.mp4
		shortName = pathlib.Path(path + "/" + filename).stem			# Example  video      (ALSO, slug is a term used in the BoltCMS mediabuilder that I'm adapting here)
		relativePath = path.replace(mediaDirectory +'/','').replace(language + '/','')
		slug = relativePath.replace('/','-') + '-' + os.path.basename(fullFilename).replace('.','-')			# Example  video.mp4
		extension = pathlib.Path(path + "/" + filename).suffix			# Example  .mp4

		# Ignore certain extensions
		if (extension is None or extension == ''):
			print ("		Skipping: Extension null: " + fullFilename)
			continue
		if (extension not in types):
			print ("		Skipping: Extension not supported: " + fullFilename)
			continue

		##########################################################################
		#  Depending on collection / single.  Load default json(s)
		##########################################################################

		# Load the item template file
		if (directoryType == "collection"):
			print ("	Loading Collection and Episode JSON")
			if ('collection' not in locals() and 'collection' not in globals()):
				f = open (templatesDirectory + "/en/data/item.json");
				collection = json.load(f);
				collection["episodes"] = [];
			f = open (templatesDirectory + "/en/data/episode.json");
			content = json.load(f);
		else:
			print ("	Loading Item JSON")
			f = open (templatesDirectory + "/en/data/item.json");
			content = json.load(f);

		# Update content attributes
		content["filename"] = filename
		content["mediaType"] = types[extension]["mediaType"]
		content["slug"] = slug
		content["title"] = shortName

		##########################################################################
		#  Handle Web Content Index Page
		##########################################################################
		# For html, the slug is just the directory name
		#			the mimeType is always zip for the zip file to download
		#			the filename is always to the zip file

		#if (extension == '.html'):
		if (filename == 'index.html'):
			print ("	Handling index.html for webpath")
			slug = relativePath.replace('/','-')  # Used to be os.path.basename(os.path.normpath(path))
			content["slug"] = slug
			content["mimeType"] = "application/zip"
			content["title"] = relativePath #used to be os.path.basename(os.path.normpath(path))
			content["filename"] = slug + ".zip"
		elif (extension == '.htm' or extension == '.html'):
			print ("	Ignoring html file not called index.html")
			continue;

		##########################################################################
		#  Mime type determination.  Try types.json, then mimetype library
		##########################################################################

		print ("	Determining Mimetype of " + extension)
		if (content["mimeType"]):
			print ("	mimeType already determined to be " + content["mimeType"])
		elif (hasattr(types[extension],"mimeType")):
			content["mimeType"] = types[extension]["mimeType"]
			print ("	mimetypes types.json says: " + content["mimeType"])
		elif (mimetypes.guess_type(fullFilename)[0] is not None):
			content["mimeType"] = mimetypes.guess_type(fullFilename)[0]
			print ("	mimetypes modules says: " + content["mimeType"])
		else:
			content["mimeType"] = "application/octet-stream"
			print ("	Default mimetype: " + content["mimeType"])

		##########################################################################
		#  Thumbnail Management
		##########################################################################

		# If this is a video, we can probably make a thumbnail
		if (content["mediaType"] == 'video' and not content["image"]):
			print ("	Attempting to make a thumbnail for the video")
			os.system("ffmpeg -y -i '" + fullFilename + "' -an -ss 00:00:15 -vframes 1 '" + mediaDirectory + "/.thumbnail-" + slug + ".png' >/dev/null 2>&1")
			content["image"] = slug + ".png"
			print ("	Thumbnail is created at: " + content["image"])

		# Look for thumbnail.  If there is one, use it.  If not
		print ("	Looking For Thumbnail (.thumbnail-" + content["image"] + ") in " + mediaDirectory)
		if (types[extension]["mediaType"] == "image"):
			print ("	Since item is image, thumbnail is the same image")
			content["image"] = filename
			os.system ("ln -s '" + fullFilename + "' " + contentDirectory + "/" + language + "/images/")
		elif (os.path.exists(mediaDirectory + "/.thumbnail-" + slug + ".png")):
			if (os.path.getsize(mediaDirectory + "/.thumbnail-" + slug + ".png") > 0):
				print ("	Linking Thumbnail: " + mediaDirectory + "/.thumbnail-" + slug + ".png")
				os.system ('ln -s "'+ mediaDirectory + '/.thumbnail-' + slug + '.png" "' + contentDirectory + '/' + language + '/images/' + slug + '.png"')
			else:
				print ("	Thumbnail not found.  Placeholder Found at location")
		else:
			print ("	Writing Placeholder For Thumbnail to " + mediaDirectory + "/.thumbnail-" + slug + ".png")
			os.system ('touch "' + mediaDirectory + '/.thumbnail-' + slug + '.png"')

    # COMMENTED OUT 20220512 because now MMI uses icons instead of images.
		#if (not content["image"]) :
		#	print ("	Writing Default Icon As Content Image")
		#	content["image"] = types[extension]["image"]

		##########################################################################
		#  Compiling Collection or Single
		##########################################################################
		if (directoryType == 'collection'):
			print ("	Adding Episode to collection.json: " + relativePath)
			if (len(collection["episodes"]) == 0):
				collection['title'] = relativePath # used to be os.path.basename(os.path.normpath(path))
				collection['slug'] = 'collection-' + os.path.basename(os.path.normpath(path))
				collection['mediaType'] = content['mediaType']
				collection['mimeType'] = content['mimeType']
				if (content["image"] == types[extension]["image"]):
				  collection['image'] = 'files.png'
				elif (content['image']):
					collection['image'] = content['image']
			elif (collection['mediaType'] == "application" and content['mediaType'] != "application"):
				print ("  Replacing collection content type with new value: " + content['mediaType']);
				collection['mediaType'] = content['mediaType'];
			collection["episodes"].append(content)
			with open(contentDirectory + "/" + language + "/data/" + collection['slug'] + ".json", 'w', encoding='utf-8') as f:
				json.dump(collection, f, ensure_ascii=False, indent=4)
		else:
			print ("	Item completed.  Writing item.json")
			# Since there's no episodes, just copy content into item
			# Write the item.json
			with open(contentDirectory + "/" + language + "/data/" + slug + ".json", 'w', encoding='utf-8') as f:
				json.dump(content, f, ensure_ascii=False, indent=4)
			mains[language]["content"].append(content)

		# Make a symlink to the file on USB to display the content
		print ("	Creating symlink for the content")
		os.system ('ln -s "' + fullFilename + '" "' + contentDirectory + '/' + language + '/media/"')
		print ("	Symlink: " + contentDirectory + '/' + language + '/media/' + filename)

		print ("	COMPLETE: Based on file type " + fullFilename + " added to enhanced interface for language " + language)
		results['processed'] = results['processed'] + 1
		# END FILE LOOP

	# Wait to write collection to main.json until directory has been fully processed
	if (('collection' in locals() or 'collection' in globals()) and directoryType == "collection"):
		print ("	No More Episodes / Wrap up Collection for " + thisDirectory)
		# slug.json has already been saved so we don't need to do that.  Just write the collection to the main.json
		mains[language]["content"].append(collection)
		del collection
	# END DIRECTORY LOOP

##########################################################################
#  Wrap up: main.json, languages.json and interface.json
##########################################################################
print ("*************************************************")
print ("Completing Final Compilation of languages and items")

# Now go through each language that we found and processed and write the interface.json and main.json for each
languageJson = []
for language in mains:
	if (len(mains[language]["content"]) == 0):
		print ("Skipping Empty Content for language:" +language)
		if (language == 'en'):
			shutil.rmtree(contentDirectory + '/en')
		continue
	print ("Writing main.json for " + language)
	with open(contentDirectory + "/" + language + "/data/main.json", 'w', encoding='utf-8') as f:
		json.dump(mains[language], f, ensure_ascii=False, indent=4)
	print ("Writing interface.json for " + language)
	with open(contentDirectory + "/" + language + "/data/interface.json", 'w', encoding='utf-8') as f:
		json.dump(interface, f, ensure_ascii=False, indent=4)
	# Add this language to the language interface
	languageJsonObject = {}
	languageJsonObject["codes"] = [language]
	languageJsonObject["text"] = languageCodes[language]["native"][0]
	languageJson.append(languageJsonObject)

if (len(languageJson) == 0):
	print ("No valid content found on the USB.  Exiting");
	exit(1);

# Determine which language should be default.  It is english or first one found
hasDefault = 0
for record in languageJson:
	if (record["codes"][0] == "en"):
		hasDefault = 1
		record["default"] = True
if (hasDefault == 0):
	languageJson[0]["default"] = True

print ("Writing languages.json")
with open(contentDirectory + "/languages.json", 'w', encoding='utf-8') as f:
	json.dump(languageJson, f, ensure_ascii=False, indent=4)


print ("Copying Metadata to Zip File On USB");
os.system ("(cd " + contentDirectory + " && zip --symlinks -r " + zipFileName + " *)");
print ("RESULTS:")
print (results)
print ("DONE");
