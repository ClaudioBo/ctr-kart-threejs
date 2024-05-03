import os

def filter_geometry(input_file, excluded_materials):
    with open(input_file, 'r') as f:
        lines = f.readlines()

    filtered_lines = []
    for line in lines:
        if line.startswith('usemtl'):
            material_name = line.strip().split()[1]
            if material_name not in excluded_materials:
                filtered_lines.append(line)
        elif not line.startswith('f ') or not any(line.startswith(f'f {i}/') for i in range(1, 49)):
            filtered_lines.append(line)

    with open(input_file, 'w') as f:
        f.write(''.join(filtered_lines))

def filter_files(folder_path, excluded_materials):
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.endswith('.obj'):
                input_file = os.path.join(root, file)
                filter_geometry(input_file, excluded_materials)

if __name__ == "__main__":
    folder_path = '.'
    excluded_materials = ['245_257_63_235_4_3', '245_256_63_235_4_4', '245_256_63_235_4_3']
    filter_files(folder_path, excluded_materials)
