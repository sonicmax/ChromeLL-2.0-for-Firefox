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

all: copy_files allBg.js allPages.js boardList.js like.js messageList.js options.js popup.js postMsg.js profile.js search.js topicList.js topicPostTemplate.js transloader.js
	
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
	
boardList.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/boardList.js $(SRC_JS)/boardList.js
	
like.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/like.js $(SRC_JS)/like.js
	
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
	
search.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/search.js $(SRC_JS)/search.js
	
topicList.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/topicList.js $(SRC_JS)/topicList.js
	
topicPostTemplate.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/topicPostTemplate.js $(SRC_JS)/topicPostTemplate.js
	
transloader.js:
	$(CC) $(CFLAGS) $(BUILD_JS)/transloader.js $(SRC_JS)/transloader.js
	
# clear the build directory
clean:
	rm -rf build/*
