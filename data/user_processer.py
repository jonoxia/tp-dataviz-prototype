#from mrjob.job import MRJob
import json
import string
import ast

class Parser(): 

    
    def stringify(self, event):
        return event[1] + "&" + event[2] + "&" + event[3]
    
    
    def parse(self):
        input_file = "desktop_heatmap_users.csv"
        output_file = "user_data_parsed.json"
    
        input_fh = open(input_file, "r")    
        out_fh = open(output_file, "w")        
        user_counts = []
                
        for user in input_fh:
            #get rid of non-jsony id
            user = user.split('\t')[1]
            
            #deal with funkiness of trues/falses to let us json load
            ##FIX
            user = string.replace(user, "false", '"False"')
            user = string.replace(user, "true", '"True"')
            user = string.replace(user, '""False""', '"False"')
            user = string.replace(user, '""True""', '"True"')
            user = json.loads(user)["events"]
            counts = {}
            states_observed = []
                        
            for event in user:
                
##commented out menu picks for right now

                if event[0] == 1:
                    event_string = self.stringify(event)
                    output_strings = []
                    
                    if event_string in ["site-id-button&&extended validation", "site-id-button&&SSL", "site-id-button&&none"]:
                        elemid = "site-id-button"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                    
##                    elif event_string == "back-button&dropdown menu&mouse pick":
##                        ##
##                        elemid = "back-button-menu"
##                        event_string = "heatmap:" + elemid + "#" + event_string
    
                    elif event_string in ["searchbar&go button&click", "searchbar&&no suggestion", "searchbar&&choose suggestion", "searchbar&&enter key","search engine dropdown&menu item&click", "search engine dropdown&menu item&menu pick"]:
                        elemid = "searchbar"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                        
                        if event_string in ["searchbar&&choose suggestion"]:
                            elemid = "searchbar-choose-suggestion"
                            output_strings.append("heatmap:" + elemid + "#" + event_string)
                            
                        if event_string == "search engine dropdown&menu item&click":
                            elemid = "searchbar-search-engine-dropdown"
                            output_strings.append("heatmap:" + elemid + "#" + event_string)    
                        
                        if event_string == "search engine dropdown&menu item&menu pick":
                            elemid = "searchbar-pick-new-search-engine"
                            output_strings.append("heatmap:" + elemid + "#" + event_string)    


                    elif event_string in ["urlbar&search term&enter key", "urlbar&url&enter key"]:
                        elemid = "urlbar"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                        #this is broken :(
                    
                    elif event_string == "bookmark toolbar&personal bookmark&click":
                        elemid = "bookmark-toolbar"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)

                    
                    elif event_string in ["urlbar&&choose suggestion", "urlbar&&no suggestion", "urlbar&search term&go button click", "urlbar&url&go button click", "urlbar-go-button&&click"]:
                        elemid = "urlbar"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                           
                            
                        if event_string in ["urlbar&search term&go button click", "urlbar&url&go button click", "urlbar-go-button&&click"]:
                            elemid = "urlbar-go-button"
                            output_strings.append("heatmap:" + elemid + "#" + event_string)
                        
                        if event_string in ["urlbar&&choose suggestion"]:
                            elemid = "urlbar-choose-suggestion"
                            output_strings.append("heatmap:" + elemid + "#" + event_string)    
                    

                    
                    elif event_string == "urlbar&most frequently used menu&open":
                        ##
                        elemid = "most-frequent-menu"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                    
                    elif event_string == "tabbar&new tab button&click":
                        elemid = "new-tab-button"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                        
                    elif event_string == "tabbar&drop down menu&click":
                        elemid = "alltabs-button"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                    
                    elif event_string == "Panorama&Tab View Interface&Opened":
                        states_observed.append(event_string)
                        
                    elif event_string == "Panorama&Tab View Interface&Closed":
                        if "Panorama&Tab View Interface&Opened" in states_observed:
                            states_observed.remove("Panorama&Tab View Interface&Opened")
                            elemid = "menu-tabview"
                            output_strings.append("heatmap:" + elemid + "#" + "Panorama&Tab View Interface&Toggled")
                    
                    elif event_string == "bookmarks-menu-botton&bookmarks-menu-button&click":
                        states_observed.append(event_string)
                        continue
                    
                    elif event_string == "bookmarks-menu-button&&click":
                        if "bookmarks-menu-botton&bookmarks-menu-button&click" in states_observed:                            
                            states_observed.remove("bookmarks-menu-botton&bookmarks-menu-button&click")
                            states_observed.append(event_string)
                            continue
                    
                    elif event_string == "bookmarks-menu-button&personal bookmark&click":
                        if "bookmarks-menu-button&&click" in states_observed:
                            states_observed.remove("bookmarks-menu-button&&click") 
                            elemid = "bookmarks-menu-button"
                            output_strings.append("heatmap:" + elemid + "#" + event_string)
                        else:
                            elemid = "bookmarks-menu-button"
                            output_strings.append("heatmap:" + elemid + "#" + event_string)

                    
##                    elif event_string == "tabbar&left scroll button&mousedown":
##                        states_observed.append(event_string)
##                        continue
##                        
##                    elif event_string == "tabbar&left scroll button&mouseup":
##                        if "tabbar&left scroll button&mousedown" in states_observed:
##                            states_observed.remove("tabbar&left scroll button&mousedown")
##                            event_string = "tabbar&left scroll button&click"
##                        else:
##                            continue
##                        
##                    elif event_string == "tabbar&right scroll button&mousedown":
##                        states_observed.append(event_string)
##                        continue
##                        
##                    elif event_string == "tabbar&right scroll button&mouseup":
##                        if "tabbar&right scroll button&mousedown" in states_observed:
##                            states_observed.remove("tabbar&right scroll button&mousedown")
##                            event_string = "tabbar&right scroll button&click"
##                        else:
##                            continue
                        
                    elif event_string == "star-button&&click":
                        states_observed.append(event_string)
                        
                    elif event_string == "star-button&edit bookmark panel&panel open":
                        states_observed.append(event_string)
                        
                    elif event_string == "star-button&remove bookmark button&click":
                        if "star-button&&click" in states_observed and "star-button&edit bookmark panel&panel open" in states_observed:
                            states_observed.remove("star-button&&click") 
                            states_observed.remove("star-button&edit bookmark panel&panel open")
                            elemid = "star-button"
                            output_strings.append("heatmap:" + elemid + "#" + event_string)
                                                  
                                                  
##                    elif event[1] in ["menu_FilePopup", "menu_EditPopup", "goPopup", "menu_ToolsPopup", "windowPopup", "menu_HelpPopup"] and event[3] == "mouse":
##                        elemid = event[2]
##                        event_string = "heatmap:" + elemid + "#" + event_string
##                        
##                    elif event[1] == "menus" and event[3] == "key shortcut":
##                        elemid = string.replace(event[2], "key", "menu")
##                        event_string = "heatmap:" + elemid + "#" + event_string
##                        
##                    elif event[1] == "tab context menu" and event[3] == "click":
##                        elemid = event[2]
##                        event_string = "heatmap:" + elemid + "#" + event_string
##                        
##                    elif event[1] == "contentAreaContextMenu" and event[3] == "click":
##                        elemid = event[2]
##                        event_string = "heatmap:" + elemid + "#" + event_string
##                        
##                    elif event[1] == "contentAreaContextMenu" and event[3] == "mouse":
##                        elemid = event[2]
##                        event_string = "heatmap:" + elemid + "#" + event_string
##                        
                    elif event[2] == "" and event[3] == "click":
                        elemid = event[1]
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                        
                    elif event[1] == "feedback-toolbar" and event[3] == "click":
                        elemid = "feedback-toolbar"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
    
                    elif event[1] == "urlbar" and event[2][0:11] == "moz-action:" and event[3] == "enter key":
                        elemid = "urlbar"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                    
                    elif event[1] == "urlbar" and event[2][0:11] == "moz-action:" and event[3] == "go button click":
                        elemid = "urlbar"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                        elemid = "urlbar-go-button"
                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                    
##                    elif event[2] == "slider" and event[3] == "drag":
##                        elemid = "-".join(event[1].split())
##                        output_strings.append("heatmap:" + elemid + "#" + event_string)
##
##                    elif event[2] == "up scroll button" and event[3] == "click":
##                        elemid = "-".join(event[1].split())
##                        output_strings.append("heatmap:" + elemid + "#" + event_string)
##                        
##                    elif event[2] == "down scroll button" and event[3] == "click":
##                        elemid = "-".join(event[1].split())
##                        output_strings.append("heatmap:" + elemid + "#" + event_string)
                   
                    else:
                        #do nothing
                        pass
                    
                    for s in output_strings:
                        if s in counts:
                            counts[s] += 1
                        else:
                            counts[s] = 1
                    
                if event[0] == 3:
                    config = "config:" + event[1] + "&" + event[2]
                    changed_config = "config_changed:" + event[1] + "&" + event[2]
                    if config in counts and counts[config] != event[3]:
                        del counts[config]
                        counts[changed_config] = event[3]
                    elif changed_config in counts and counts[changed_config] != event[3]:             
                        counts[changed_config] = event[3]
                    else:
                        counts[config] = event[3]
             
            #wrap up any uncompleted states   
            
            if "bookmarks-menu-button&&click" in states_observed:
                if "bookmarks-menu-button&&click" in counts:
                    counts["heatmap:bookmarks-menu-button#bookmarks-menu-button&&click"] += 1
                else:
                    counts["heatmap:bookmarks-menu-button#bookmarks-menu-button&&click"] = 1
            
            
            if "star-button&&click" in states_observed:
                
                if "star-button&&click" in counts:
                    counts["heatmap:star-button#star-button&&click"] += 1
                else:
                    counts["heatmap:star-button#star-button&&click"] = 1
            
            user_counts.append(counts)
            
        out_fh.write(json.dumps(user_counts))
        out_fh.close()
        for a in counts:
            print a, counts[a]
    
if __name__ == '__main__':
    p = Parser()
    p.parse()