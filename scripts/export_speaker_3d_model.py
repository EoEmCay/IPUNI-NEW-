import os
import math

out_obj = 'd:/DIA+/dai_loa_am_thanh_calendia_chuan.obj'
out_stl = 'd:/DIA+/dai_loa_am_thanh_calendia_chuan.stl'

# 3D Plate Dimensions (in millimeters)
# Trapezoid matching user's design:
# Top width = 160 mm (X: -80 to +80)
# Bottom width = 110 mm (X: -55 to +55)
# Height = 42 mm (Y: -21 to +21)
# Thickness = 2.5 mm (Z: 0.0 to 2.5)

# Slits definitions (4 tiers)
# Each slit is a rectangular through-hole: (cx, cy, w, h)
slit_w = 2.0
slit_h = 5.2
row_configs = [
    (12.0, 22, 5.0),  # (y_center, count, pitch)
    (4.5, 18, 5.0),
    (-3.0, 14, 5.0),
    (-10.5, 8, 5.0)
]

slits = []
for cy, count, pitch in row_configs:
    start_x = - (count - 1) * pitch / 2.0
    for i in range(count):
        cx = start_x + i * pitch
        slits.append((cx, cy, slit_w, slit_h))

print(f"Total slits: {len(slits)}")

# We can generate a clean heightfield or polygonal mesh
# A very clean way: triangulated mesh with holes or grid-based solid
# Using a 2D grid: 320 x 84 cells (each cell 0.5mm x 0.5mm)
# For each cell: inside plate? inside slit?
nx, ny = 320, 84
dx = 160.0 / nx  # 0.5 mm
dy = 42.0 / ny   # 0.5 mm
t_thick = 2.5    # 2.5 mm

# Grid points: x from -80 to +80, y from -21 to +21
def is_in_plate(x, y):
    if y < -21.0 or y > 21.0:
        return False
    # linear width: at y=+21, w=160; at y=-21, w=110
    w_at_y = 110.0 + (y + 21.0) / 42.0 * (160.0 - 110.0)
    return abs(x) <= w_at_y / 2.0

def is_in_slit(x, y):
    for sx, sy, sw, sh in slits:
        if abs(x - sx) <= sw / 2.0 and abs(y - sy) <= sh / 2.0:
            return True
    return False

# Build voxel / block mesh for perfect watertightness
facets = []

# Helper to add quad facet (2 triangles)
def add_quad(v1, v2, v3, v4):
    # Triangle 1: v1, v2, v3
    n1 = [0.0, 0.0, 1.0]
    facets.append((n1, v1, v2, v3))
    # Triangle 2: v1, v3, v4
    facets.append((n1, v1, v3, v4))

# Let's create an OBJ file with vertices and faces
vertices = []
faces = []
v_dict = {}

def get_v_idx(x, y, z):
    key = (round(x, 3), round(y, 3), round(z, 3))
    if key not in v_dict:
        v_dict[key] = len(vertices) + 1
        vertices.append(key)
    return v_dict[key]

# We will export a clean box array of active cells
# To keep file compact, let's step by 1.0mm (nx=160, ny=42)
nx, ny = 160, 42
dx = 160.0 / nx
dy = 42.0 / ny

grid = [[False for _ in range(nx)] for _ in range(ny)]
for iy in range(ny):
    y = -21.0 + (iy + 0.5) * dy
    for ix in range(nx):
        x = -80.0 + (ix + 0.5) * dx
        if is_in_plate(x, y) and not is_in_slit(x, y):
            grid[iy][ix] = True

print("Grid evaluated, building 3D mesh...")

# Generate front and back faces, and side walls
for iy in range(ny):
    y0 = -21.0 + iy * dy
    y1 = y0 + dy
    for ix in range(nx):
        if not grid[iy][ix]:
            continue
        x0 = -80.0 + ix * dx
        x1 = x0 + dx
        
        # Front face (z = 2.5)
        v1 = get_v_idx(x0, y0, t_thick)
        v2 = get_v_idx(x1, y0, t_thick)
        v3 = get_v_idx(x1, y1, t_thick)
        v4 = get_v_idx(x0, y1, t_thick)
        faces.append((v1, v2, v3))
        faces.append((v1, v3, v4))
        
        # Back face (z = 0.0)
        bv1 = get_v_idx(x0, y0, 0.0)
        bv2 = get_v_idx(x1, y0, 0.0)
        bv3 = get_v_idx(x1, y1, 0.0)
        bv4 = get_v_idx(x0, y1, 0.0)
        faces.append((bv1, bv3, bv2))
        faces.append((bv1, bv4, bv3))
        
        # North wall (iy + 1 is False)
        if iy == ny - 1 or not grid[iy + 1][ix]:
            faces.append((v4, v3, bv3))
            faces.append((v4, bv3, bv4))
            
        # South wall (iy - 1 is False)
        if iy == 0 or not grid[iy - 1][ix]:
            faces.append((v1, bv2, v2))
            faces.append((v1, bv1, bv2))
            
        # East wall (ix + 1 is False)
        if ix == nx - 1 or not grid[iy][ix + 1]:
            faces.append((v2, bv3, v3))
            faces.append((v2, bv2, bv3))
            
        # West wall (ix - 1 is False)
        if ix == 0 or not grid[iy][ix - 1]:
            faces.append((v1, v4, bv4))
            faces.append((v1, bv4, bv1))

print(f"Total Vertices: {len(vertices)}, Total Faces: {len(faces)}")

# Write OBJ file
with open(out_obj, 'w', encoding='utf-8') as f:
    f.write("# CalenDIA+ Acoustic Speaker Grille 3D Model\n")
    f.write("# Perfectly flat faceplate (2.5 mm thickness), 4-tier sound slits\n")
    f.write(f"o CalenDIA_Speaker_Grille\n")
    for v in vertices:
        f.write(f"v {v[0]:.3f} {v[1]:.3f} {v[2]:.3f}\n")
    for face in faces:
        f.write(f"f {face[0]} {face[1]} {face[2]}\n")

print(f"Exported OBJ: {out_obj}")

# Write binary STL file for compact size and fast loading
import struct

with open(out_stl, 'wb') as f:
    header = b'CalenDIA+ Speaker Grille 3D Model PETG FDM'
    header = header.ljust(80, b' ')
    f.write(header)
    f.write(struct.pack('<I', len(faces)))
    
    for face in faces:
        v1 = vertices[face[0] - 1]
        v2 = vertices[face[1] - 1]
        v3 = vertices[face[2] - 1]
        
        # Normal vector calculation
        ax, ay, az = v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]
        bx, by, bz = v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]
        nx = ay * bz - az * by
        ny = az * bx - ax * bz
        nz = ax * by - ay * bx
        l = math.sqrt(nx*nx + ny*ny + nz*nz)
        if l > 1e-6:
            nx /= l
            ny /= l
            nz /= l
        else:
            nx, ny, nz = 0.0, 0.0, 1.0
            
        f.write(struct.pack('<3f', nx, ny, nz))
        f.write(struct.pack('<3f', v1[0], v1[1], v1[2]))
        f.write(struct.pack('<3f', v2[0], v2[1], v2[2]))
        f.write(struct.pack('<3f', v3[0], v3[1], v3[2]))
        f.write(struct.pack('<H', 0))

print(f"Exported STL: {out_stl}")
