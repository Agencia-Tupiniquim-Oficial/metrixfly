import colorsys
from PIL import Image

# HSL to RGB conversion
# H: 149, S: 100%, L: 28%
r, g, b = colorsys.hls_to_rgb(149/360, 0.28, 1.0)
target_r, target_g, target_b = int(r * 255), int(g * 255), int(b * 255)

print(f"Target RGB: {target_r}, {target_g}, {target_b}")

img = Image.open('src/assets/logo.png').convert("RGBA")
data = img.getdata()

new_data = []
for item in data:
    # item is (R, G, B, A)
    # We want to change the color but keep the alpha
    # If the image is mostly white/black, we can replace non-transparent pixels
    # For a flat logo, replacing all R, G, B with the target and keeping A works perfectly.
    # However, if there's anti-aliasing (grays), a pure replace is fine for solid logos, 
    # but might lose brightness variations. Let's assume it's a solid logo mask.
    if item[3] > 0:
        new_data.append((target_r, target_g, target_b, item[3]))
    else:
        new_data.append(item)

img.putdata(new_data)
img.save('src/assets/logo-colored.png')
print("Saved as src/assets/logo-colored.png")
