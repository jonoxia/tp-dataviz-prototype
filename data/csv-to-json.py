import simplejson

output_filename = "beta_ui-data.json"

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

out_file = open(output_filename, "w")

events_file = open("events_small.csv", "r")
users_file = open("users.csv", "r")
survey_file = open("survey.csv", "r")

events_cols = events_file.readline().split(",")
users_cols = users_file.readline().split(",")
survey_cols = survey_file.readline().split(",")

user_id = 0

out_file.write("[")

while user_id < user_limit:
    print user_id
    user_obj = {}
    user_metadata = users_file.readline().strip('\n').split(",")
    user_id = int(user_metadata[0])

    for i in xrange(len(users_cols)):
        user_obj[ users_cols[i].strip("\n") ] = user_metadata[i].strip("\n").strip("\"")

    survey_answers = survey_file.readline().strip('\n').split(",")
    for i in xrange(len(survey_cols)):
        user_obj[ survey_cols[i].strip("\n") ] = survey_answers[i].strip("\n").strip("\"")

    user_obj["events"] = []
    event_row = events_file.readline().strip('\n').split(",")
    while int(event_row[0]) == user_id:
        event_obj = {}
        for i in xrange(len(events_cols)):
            event_obj[ events_cols[i].strip("\n") ] = event_row[i].strip("\n").strip("\"")
        user_obj["events"].append(event_obj)
        event_row = events_file.readline().split(",")

    out_file.write(simplejson.dumps(user_obj))

    if user_id < user_limit:
        out_file.write(", ") # no trailing comma after last one!

out_file.write("]")

out_file.close()
events_file.close()
users_file.close()
survey_file.close()
