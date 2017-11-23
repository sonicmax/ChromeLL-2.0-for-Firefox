# Makefile for ChomeLL written by xDrVonScottx
# Requires: 
#	1) a *nix-like os or Cygwin/MinGW/whatever in windows
# 	2) Java 7 or higher installed

CC=java -jar toolchain/compiler.jar
CFLAGS=--js_output_file
BUILD_DIR=build
BUILD_SRC=$(BUILD_DIR)/src
BUILD_JS=$(BUILD_SRC)/js
SRC_JS=src/js

all: copy_files allBg.js allPages.js backtotopic.js dramalinks.js imagemap.js messageList.js options.js popup.js postMsg.js profile.js promptHandler.js search.js tokenhelper.js topicList.js topicPostTemplate.js transloader.js
	
copy_files:
	-mkdir build
	# this isn't used yet
	-mkdir dist 
	# copy files in root dir
	cp background.js manifest.json options.html $(BUILD_DIR) 
	# copy lib
	cp -r lib/ $(BUILD_DIR) 
	# make src dir
	-mkdir $(BUILD_SRC) 
	# copy static src files
	cp -r src/css src/html src/images src/json $(BUILD_SRC) 
	# make js dir
	-mkdir $(BUILD_JS) 

# Compile js file targets
allBg.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/allBg.js $(SRC_JS)/allBg.js
	
allPages.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/allPages.js $(SRC_JS)/allPages.js
	
backtotopic.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/backtotopic.js $(SRC_JS)/backtotopic.js

imagemap.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/imagemap.js $(SRC_JS)/imagemap.js
	
messageList.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/messageList.js $(SRC_JS)/messageList.js
	
options.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/options.js $(SRC_JS)/options.js
	
popup.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/popup.js $(SRC_JS)/popup.js
	
postMsg.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/postMsg.js $(SRC_JS)/postMsg.js
	
profile.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/profile.js $(SRC_JS)/profile.js
	
promptHandler.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/promptHandler.js $(SRC_JS)/promptHandler.js
	
search.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/search.js $(SRC_JS)/search.js

tokenhelper.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/tokenhelper.js $(SRC_JS)/tokenhelper.js
	
topicList.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/topicList.js $(SRC_JS)/topicList.js
	
topicPostTemplate.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/topicPostTemplate.js $(SRC_JS)/topicPostTemplate.js
	
transloader.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/transloader.js $(SRC_JS)/transloader.js
	
dramalinks.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/dramalinks.js $(SRC_JS)/dramalinks.js

	
# clear the build directory
clean:
	rm -rf build/*
