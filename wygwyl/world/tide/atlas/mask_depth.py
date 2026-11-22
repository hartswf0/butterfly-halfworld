"""Write each frame's mask into its depth as NaN (no geometry), since the draft splat path does not apply maskAsset.
usage: python atlas/mask_depth.py <scene dir>   -> <dir>/posed/NN_depth_masked.exr"""
import os, sys, numpy as np, cv2, OpenEXR
D = sys.argv[1]; n = 0
while os.path.exists(f'{D}/posed/{n:02d}_depth.exr'):
    f = OpenEXR.File(f'{D}/posed/{n:02d}_depth.exr'); d = f.channels()['Y'].pixels.copy()
    m = cv2.resize(cv2.imread(f'{D}/masks/{n:02d}.png', 0), (d.shape[1], d.shape[0]), interpolation=cv2.INTER_NEAREST) < 128
    d[m] = np.nan; out = OpenEXR.File(f.header(), {'Y': d}); out.write(f'{D}/posed/{n:02d}_depth_masked.exr'); n += 1
print(D, n, 'masked depths')
