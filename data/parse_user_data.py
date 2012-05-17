import json
from collections import defaultdict

input_file = "user_data_parsed.json"
output_file = "../desktop-heatmap/action_counts.json"

input_fh = open(input_file, "r")
user_actions= input_fh.read()
user_actions = json.loads(user_actions)
input_fh.close()
elem_counts = defaultdict(lambda: defaultdict(int))
empty_users = 0
all_elems = []

for user in user_actions:
    if len(user) == 0:
        empty_users += 1
        continue
    seen = []
    for action in user: #if an action is listed, it means the user performed
                        #it at least once
        if action[0:8] == "heatmap:":
            elem = action[8:action.find("#")]
            if elem not in all_elems:
                all_elems.append(elem)
            if elem not in seen:
                elem_counts[elem]["count"] += 1
                seen.append(elem)
            #sometimes, multiple actions map to the same ui element

for w in all_elems:    
    print w

n_users = len(user_actions) - empty_users
for action_str in elem_counts:
    elem_counts[action_str]["percent"] = round(float(elem_counts[action_str]["count"])*100/n_users,1)

#mapper_file = "action_mapper.json"
locations_file = "locations.json"
#mapper_fh = open(mapper_file, "r")
locations_fh = open(locations_file, "r")
#id_action_map = mapper_fh.read()
#id_action_map = json.loads(id_action_map)
locs = locations_fh.read()
locs = json.loads(locs)

final_elems = []

#get all actions from the map created above, and see if coordinates are available from snapshot

for id in elem_counts:
    if id in locs:
        elem = {}
        elem["elemName"] = " ".join(id.split("-")).title()
        elem["coords"] = locs[id]
        elem["count"] = elem_counts[id]["count"]
        elem["percent"] = elem_counts[id]["percent"]
        final_elems.append(elem)

output_fh = open(output_file, "w")
output_fh.write(json.dumps(final_elems))

#mapper_fh.close()
locations_fh.close()
output_fh.close()




                