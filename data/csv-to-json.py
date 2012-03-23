import simplejson

user_out_filename = "beta_ui-data-users.json"
event_out_filename = "beta_ui-data-events.json"

user_limit = 50


"""Format of events_small.csv:
user_id,timestamp,category,item
0,1289333685802,customization,"menu bar hidden"

"""

"""format of users.csv:
id,location,fx_version,os,version,survey_answers,number_extensions
0,"",4.0b7,"WINNT Windows NT 6.1",1.0.3,"",3
"""

"""Format of survey.csv:
user_id,q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14
1,3,1,3,1,0,2,0,10,1,7,0,7,1,
5,6,1,1,1,,,,,0|1,,0|3|4,0|1|2|7|8,,
13,6,1,0,1,0,1,3,9,0|2|3,0,0|2|3|4|5|6,0|1|2|3|5|7|8|9,0,
15,4,1,0,2,0,1,6,9,0|1|3,"<freeform-text removed>",0|1|2|3|4|5|6,0|1|3|4|5|6|7|8|9|10|11|12,0|1|5,"<freeform-text removed>"
"""

user_out_file = open(user_out_filename, "w")
event_out_file = open(event_out_filename, "w")

events_file = open("events_small.csv", "r")
users_file = open("users.csv", "r")
survey_file = open("survey.csv", "r")

events_cols = events_file.readline().split(",")
users_cols = users_file.readline().split(",")
survey_cols = survey_file.readline().split(",")

user_id = 0

user_out_file.write("[")
event_out_file.write("[")

# Ouptut two files: users.json and events.json.

event_row = events_file.readline().strip('\n').split(",")

while user_id < user_limit:
    print user_id

    # Add data from users file to user object
    user_obj = {}
    user_metadata = users_file.readline().strip('\n').split(",")
    user_id = int(user_metadata[0])
    for i in xrange(len(users_cols)):
        user_obj[ users_cols[i].strip("\n") ] = user_metadata[i].strip("\n").strip("\"")

    # Add data from survey answers file to user object
    survey_answers = survey_file.readline().strip('\n').split(",")
    for i in xrange(len(survey_cols)):
        user_obj[ survey_cols[i].strip("\n") ] = survey_answers[i].strip("\n").strip("\"")

    # look at all user's events
    event_counter = {}
    event_total = 0
    while int(event_row[0]) == user_id:
        # Get event fields:
        event_obj = {}
        for i in xrange(len(events_cols)):
            event_obj[ events_cols[i].strip("\n") ] = event_row[i].strip("\n").strip("\"")
       
        event_type = event_obj["item"]  # TODO name of this field will vary by study

        # is event a customization?
        if (event_obj["category"] == "customization"):
            if event_type == "menu bar hidden":
                user_obj["customize_menu_bar"] = "hidden"
            if event_type == "menu bar shown":
                user_obj["customize_menu_bar"] = "shown"
            if event_type == "tabs on top":
                user_obj["customize_tabs"] = "top"
            if event_type == "tabs on bottom":
                user_obj["customize_tabs"] = "bottom"
            if event_type == "bookmark bar hidden":
                user_obj["customize_bookmark_bar"] = "hidden"
            if event_type == "bookmark bar shown":
                user_obj["customize_bookmark_bar"] = "shown"
            if event_type == "status bar hidden":
                user_obj["customize_status_bar"] = "hidden"
            if event_type == "status bar shown":
                user_obj["customize_status_bar"] = "shown"
        else: 
            # add event to event_counter totals:
            if ( event_counter.has_key( event_type) ):
                event_counter[event_type] += 1
            else:
                event_counter[event_type] = 1
            event_total += 1

        # write event to event file:
        event_out_file.write( simplejson.dumps(event_obj) )
        event_out_file.write(", ") # TODO bug this will have a trailing comma we don't want

        # get next event, if there is one:
        event_row = events_file.readline().strip('\n').split(",")


    # make aggregated event type counts into user-level data:
    # numEvents field counts total number of events
    # numEvents_item=x  counts events where the item field has value x
    user_obj["numEvents"] = event_total
    for key in event_counter.keys():
        user_obj["numEvents_item=%s" % key] = event_counter[key]
    
    # Write user to users file:
    user_out_file.write(simplejson.dumps(user_obj))

    if user_id < user_limit:
        user_out_file.write(", ") # no trailing comma after last one!

user_out_file.write("]")

event_out_file.close()
user_out_file.close()
events_file.close()
users_file.close()
survey_file.close()
