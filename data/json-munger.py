import simplejson
import sys

# Input: file with one row per user, containing complete JSON submission for that user, i.e.
# exactly what that user's Test Pilot submitted to the server. e.g. the file output by gimmedata.py.

# Output: JSON file which is an array containing one object per user; each user object is FLAT
#  and its properties are event counts, e.g. "backButton_clicks: 3". No sequence or timestamp data.
# Also has metadata properties such as osVersion, fxVersion, customization state, etc.

# Output file is what will be consumed by xyplot.html

# Possible future output: Another JSON file which is flattened into events instead of flattened into
# users.

# This script accomplishes same thing as csv-to-json.py except that intput is json, not csv.

all_variable_names = {}
all_os_names = {}

def getOSName(osString):
    if "WINNT" in osString:
        if ("5.1" in osString) or ("5.2" in osString):
            return "Win XP"
        if "6.0" in osString:
            return "Win Vista"
        if "6.1" in osString:
            return "Win 7"
        if "6.2" in osString:
            return "Win 8"
    if "Mac OS X" in osString:
        return "Mac OS"
    if "Linux" in osString:
        return "Linux"
    else:
        return "Other"


def mungeMetadata(inputRecord, outputRecord):
    metadata_fields = [u'updateChannel',
                       u'fxVersion',
                       u'tpVersion',
                       u'location']

    # Unused metadata fields: accessibilities, event_headers, task_guid. extensions is counted instead of
    # used directly. surveyAnswers will be used in future but requires its own specialized parsing to make
    # sense of.
    for field in metadata_fields:
        outputRecord[field] = inputRecord["metadata"][field]
 
    if inputRecord["metadata"].has_key("operatingSystem"):
        outputRecord["operatingSystem"] = getOSName(inputRecord["metadata"]["operatingSystem"])
    
    if outputRecord.has_key("operatingSystem"):
        all_os_names[outputRecord["operatingSystem"]] = True

    # Special-case: extension count
    outputRecord["number_extensions"] = len(inputRecord["metadata"]["extensions"])


def mungeCustomizations(inputRecord, outputRecord):

    customizations = [ event[1:4] for event in inputRecord["events"] if event[0] == 3]
        
    # TODO menu bar hidden is producing some with a blank name somehow? not undefined but ""?
    map = [ {"signature": ["menu bar", "hidden?"],
             "varId": "menu_bar_hidden",
             "values": {"true": "Hidden", "false": "Shown"}
             },
            {"signature": ["bookmark bar", "hidden?"],
             "varId": "bookmark_bar_hidden",
             "values": {"true": "Hidden", "false": "Shown"}
             },
            {"signature": ["status bar", "hidden?"],
             "varId": "status_bar_hidden",
             "values": {"true": "Hidden", "false": "Shown"}
             },
            {"signature": ["addon bar", "hidden?"],
             "varId": "addon_bar_hidden",
             "values": {"true": "Hidden", "false": "Shown"}
             },
            {"signature": ["tab bar", "tabs on top?"],
             "varId": "tabs_on_top",
             "values": {"true": "Top", "false": "Bottom"}
             },
            {"signature": ["Tab Bar", "Num App Tabs"],
             "varId": "num_app_tabs"
             },
            {"signature": ["Sync", "Configured?"],
             "varId": "sync_configured"
             },
            {"signature": ["bookmark bar", "num. bookmarks"],
             "varId": "num_bookmarks_in_bar"
             },
            {"signature": ["Window", "Total Number of Tabs"] ,
             "varId": "num_tabs_in_window"
             },
            {"signature": ["Panorama", "Num Groups?"], # appears to be missing
             "varId": "num_panorama_groups"
             }
            ]

    # Customizations not in the variables file:
    # Sync - Last Sync Time
    # Panorama - Num Groups?
    # Panorama - Num Tabs In Group?

    # Note - "Panorama - Num Groups?" and "Panorama - Num Tabs In Group?"
    # are customizations that do NOT work this way! multiple records of "Num Tabs In Group" are recording
    # the number of tabs in each different group.
    
    # "Window - Total Number of Tabs" also does not work this way; I think it's recorded once for
    # each window in fact. (currently using it wrong in variables file.)

    for cust in customizations:
        # notice later customizations will overwrite earlier customizations
        # TODO actually indicate in the record that user modified this value; we'll want to 
        # exclude users who modified the value during the study from some analysis.
        for mapping in map:
            if cust[0] == mapping["signature"][0] and cust[1] == mapping["signature"][1]:
                if mapping.has_key("values"):
                    if mapping["values"].has_key(cust[2]):
                        outputRecord[mapping["varId"]] = mapping["values"][cust[2]]
                        break
                outputRecord[mapping["varId"]] = cust[2]
                break

def lazyGetEventName(event):
    return "numUses_%s" % ( event[0].replace(" ", "-"))

def getEventName(event):
    # Let's see what events we might have to special-case names for:
    # TODO combine a sequence like this:
    # [u'urlbar', u'search term', u'enter key'],
    # [u'urlbar', u'', u'no suggestion']
    # into one event, called like "urlbar - search term - enter key - no suggestion"

    # OR is it? What do we really want here? Maybe increment "total URL bar uses", increment
    # 'search terms in url bar', increment 'url bar without suggestions', increment 'url bar by
    # enter key', and increment "total keyboard actions" ??
    # so maybe we really want a function that returns all af the event types that should be
    # incremented???
    if event[0] == u"window":
        try:
            # if the middle value is a number, it's a window id - ignore it for the count!
            # TODO although later we probably want to know how many users window had open, so we
            # want max window id!
            windowNum = int(event[1])
            return event[2]
        except:
            pass

    # It appears we have nameless keyboard shortcuts in the data set!
    # It shows up as [u'menus', u'', u'key shortcut']
    if (event[0] == u"menus" and event[1] == u"" and event[2] == "key shortcut"):
        return "Nameless keyboard shortcut"

    

    # TODO a sequence such as search engine dropdown - menu item - click
    # search engine dropdown - menu item - menu pick
    # should get counted only as a single event.


    # Drop part if it's just "mouse' or "click' or 'key shortcut': (TODO really process this though)
    # TODO this is creating a nameless event
    clippedEvent = [part for part in event if not (part in [u"mouse", u"click", u"key shortcut", u"", u"menus"])]


    if len(clippedEvent) == 0:
        print event 

    return " - ".join(event)

def mungeEvents(inputRecord, outputRecord):
    events = [ event[1:4] for event in inputRecord["events"] if event[0] == 1]
    for event in events:
        name = lazyGetEventName(event)
        if outputRecord.has_key(name):
            outputRecord[name] += 1
        else:
            outputRecord[name] = 1


def munge(inFileName, outFileName, userLimit):
    infile = open(inFileName, "r")
    outfile = open(outFileName, "w")

    lineNum = 0
    outfile.write("[")
    for line in infile:
        lineNum += 1
        print "Working on user %d" % lineNum
        if not "{" in line:   # if we find a blank line, skip it!
            continue
        if lineNum > 1:
            outfile.write(",\n")

        # Strip out the junk, parse the json into a user object
        line = line.strip("\n")
        line = line[ line.find("{"): ]
        user = simplejson.loads(line)

        flat_user = {}

        # Metadata:
        mungeMetadata(user, flat_user)

        # Customizations:
        mungeCustomizations(user, flat_user)

        # Events:
        mungeEvents(user, flat_user)

        outfile.write( simplejson.dumps(flat_user))

        # Collect any new variable names for the eventual variables file:
        for key in flat_user.keys():
            all_variable_names[key] = True

        if (userLimit != None) and (lineNum > userLimit):
            break
        
    outfile.write("]")

    infile.close()
    outfile.close()

    for key in all_os_names.keys():
        print key
    #for key in all_variable_names.keys():
    #    print key


if __name__ == "__main__":
    if len(sys.argv) == 3 or len(sys.argv) == 4:
        inFileName = sys.argv[1]
        outFileName = sys.argv[2]
        if len(sys.argv) > 3:
            userLimit = int(sys.argv[3])
        else:
            userLimit = None
        munge(inFileName, outFileName, userLimit)
    else:
        print "Usage: python json-munger.py inputfile outputfile [user-limit]"

    
