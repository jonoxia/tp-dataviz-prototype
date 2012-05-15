#!/usr/bin/python

# How to use:
# 1. Run this on the Hadoop server.
# 2. Run with no arguments (python gimmedata.py) to see all the testpilot 
# studies.
# 3. Run with name of study (python gimmedata.py
# testpilot_desktop_heatmap_2012) to see size of the data in the study
# 4. Run with name of study and a number 1-100 (python gimmedata.py
# testpilot_desktop_heatmap_2012 2) to select that percentage of users
# Output will go to a json file. It takes a while.

import sys
import subprocess
import os
import random

def findSize(directory):
  process = subprocess.Popen(["hadoop", "dfs", "-count", "/bagheera/%s" % directory], shell=False,
                             stdout=subprocess.PIPE)
  output = process.communicate()[0]
  words = output.split(" ")
  words = [x for x in words if x != ""]
  return int(words[2])

def hadoopListDir(directory):
  process = subprocess.Popen(["hadoop", "dfs", "-ls", "/bagheera/%s" % directory], shell=False,
                             stdout=subprocess.PIPE)
  output = process.communicate()[0]
  lines = output.split("\n")
  files = []
  for line in lines:
    if "/" in line:
      files.append( line.split("/")[-1] )
  return files

def barfFile(directory, filename):
  process = subprocess.Popen(["hadoop", "dfs", "-text", "/bagheera/%s/%s" % (directory, filename)],
                             shell=False, stdout=subprocess.PIPE)
  output = process.communicate()[0]
  lines = output.split("\n")
  return lines

def makeOutputFile(directory, percentage):
  directory = sys.argv[1]
  filenames = []

  outFileName = "%s_%d.json" % (directory, percentage)
  outputFile = open(outFileName , "w")  

  print "Output will be written to %s." % outFileName
  print "This will take a while, go get some coffee or something."
  subdirs = hadoopListDir(directory)
  i = 0
  for subdir in subdirs:
    i += 1
    print "Reading %d out of %d directories" % (i, len(subdirs))
    moreFiles = hadoopListDir( os.path.join(directory, subdir) )
    filenames.extend( [ "%s/%s" % (subdir, f) for f in moreFiles ])

  i = 0
  for fname in filenames:
    i += 1
    print "Processing %d out of %d files" % (i, len(filenames))
    lines = barfFile(directory, fname)
    print "%d users in this file" % len(lines)
    taken = 0
    for line in lines:
      if random.randrange(100) < percentage:
        taken += 1
        outputFile.write(line)
    print "Included %d of them." % taken

  outputFile.close()
    

if len(sys.argv) == 1:
  print "Here are the available studies."
  subprocess.call(["hadoop", "dfs", "-ls", "/bagheera"])
  print "Pick one! (python gimmedata.py studyname)"
elif len(sys.argv) == 2:
  size = findSize(sys.argv[1])
  print "Full dataset is %d bytes. What percent do you want? (python gimmedata.py study 10)" % size
elif len(sys.argv) == 3:
  makeOutputFile(sys.argv[1], int(sys.argv[2]))
  
