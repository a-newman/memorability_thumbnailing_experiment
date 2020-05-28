import json
import os
import random
import shutil

import numpy as np
from tqdm import tqdm

import make_crops

SF_DIR = os.path.join("../front-end/src", "subject_files")
LONG_VIDS_RELPATH = "data/long_vids"
MEM_CROPS_RELPATH = "data/mem_crops"
CENTER_CROPS_RELPATH = "data/center_crops"
FILLER_CROPS_RELPATH = "data/filler_crops"


def select_crops(target_vids):
    targets = [elt for elt in target_vids]
    # half of the target crops should be mem crops, half should be center crops
    random.shuffle(targets)
    mid = int(len(targets) / 2)
    mem_crops_vids, center_crop_vids = targets[:mid], targets[mid:]
    assert len(mem_crops_vids) == len(center_crop_vids)

    mem_crops = [
        os.path.join(MEM_CROPS_RELPATH, elt) for elt in mem_crops_vids
    ]
    center_crops = [
        os.path.join(CENTER_CROPS_RELPATH, elt) for elt in center_crop_vids
    ]

    filler_vids = os.listdir(make_crops.FILLER_CROPS_PATH)
    filler_crops = random.sample(filler_vids, k=len(targets))
    filler_crops = [
        os.path.join(FILLER_CROPS_RELPATH, elt) for elt in filler_crops
    ]

    all_vids = mem_crops + center_crops + filler_crops
    random.shuffle(all_vids)

    return all_vids


def make_subject_file():
    target_vidnames = os.listdir(make_crops.LONG_VIDS_PATH)
    target_vidpaths = [
        os.path.join(LONG_VIDS_RELPATH, elt) for elt in target_vidnames
    ]
    random.shuffle(target_vidpaths)

    crops = select_crops(target_vidnames)

    return {'long_videos': target_vidpaths, 'crops': crops}


def make_subject_files(n):
    if os.path.exists(SF_DIR):
        shutil.rmtree(SF_DIR)

    os.makedirs(SF_DIR)

    for i in tqdm(range(n)):
        savepath = os.path.join(SF_DIR, "{}.json".format(i))
        sf = make_subject_file()
        with open(savepath, "w") as outfile:
            json.dump(sf, outfile)


if __name__ == "__main__":
    make_subject_files(1000)
