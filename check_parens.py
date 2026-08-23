import sys

def check_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char in '({[':
                stack.append((char, i+1, j+1))
            elif char in ')}]':
                if not stack:
                    print(f"Unmatched {char} at {filepath}:{i+1}:{j+1}")
                    return False
                last, li, lj = stack.pop()
                if (char == ')' and last != '(') or \
                   (char == '}' and last != '{') or \
                   (char == ']' and last != '['):
                    print(f"Mismatched {char} at {filepath}:{i+1}:{j+1}, expected match for {last} from {li}:{lj}")
                    return False
    if stack:
        for char, li, lj in stack:
            print(f"Unmatched {char} at {filepath}:{li}:{lj}")
        return False
    return True

import glob
for f in glob.glob("apps/api/src/**/*.ts", recursive=True):
    check_file(f)
for f in glob.glob("apps/web/src/**/*.ts*", recursive=True):
    check_file(f)
for f in glob.glob("packages/shared/src/**/*.ts", recursive=True):
    check_file(f)
