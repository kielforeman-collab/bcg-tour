import sys

filename = r"c:\Users\User\OneDrive\Desktop\BCGTOUR\index.html"

with open(filename, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Replace lines 329-1043 with scripts
scripts = """    <script src="data.js"></script>
    <script src="ui.js"></script>
    <script src="flights.js"></script>
    <script src="sync.js"></script>
    <script src="app.js"></script>
"""

# Note: lists are 0-indexed, so line 329 is index 328
# End line 1043 is index 1042. So we replace 328 to 1043 (exclusive)
new_lines = lines[:328] + [scripts] + lines[1043:]

# Replace lines 23-82 with link
link = '    <link rel="stylesheet" href="style.css">\n'
# lines 23 is index 22, 82 is index 81 => replace 22 to 82 (exclusive)
new_lines = new_lines[:22] + [link] + new_lines[82:]

with open(filename, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Replaced CSS and JS blocks in index.html")
