# Requires the Require Optmizer
# http://requirejs.org/docs/optimization.html#download
OPTIMIZE = r.js -o app.build.js

# Output MUST be outside of the project directory
OUTPUT=../dashboard-build

# Command to run s3cmd
S3CMD = s3cmd

# Default S3 sub-path to upload to 
# Main S3 bucket is set below
S3DIR = admin-matth

all: build
.PHONY: all

# Make the output directory if it doesn't already exist
$(OUTPUT):
	mkdir -p $(OUTPUT)

# This is all we need to do to optimize and minify everything (including CSS)
.PHONY: minify
minify:
	r.js -o js/app.build.js

build: $(OUTPUT) minify
.PHONY: build

# This is dangerous, so I commented it out for now. 
.PHONY: clean
clean:
	# rm -rf $(OUTPUT)

# Deploy the files to an S3 bucket
.PHONY: deploy
deploy:
	# Deploy remote settings
	# cp $(OUTPUT)/js/settings.remote.js $(OUTPUT)/js/settings.js
  
	# The trailing slash on the local directory is important, so that we sync the
	# contents of the directory and not the directory itself.
	$(S3CMD) sync $(OUTPUT)/ s3://locald/web/$(S3DIR)/
