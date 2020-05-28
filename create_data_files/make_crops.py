import datetime
import json
import math
import os
import random
import shutil
import subprocess

import cv2
import numpy as np
from tqdm import tqdm

LENS_PATH = "oops_lens.json"
SCORES_PATH = "oops_scores_long.json"
FE_PATH = "../front-end/public/data"
LONG_VIDS_PATH = os.path.join(FE_PATH, "long_vids")
MEM_CROPS_PATH = os.path.join(FE_PATH, "mem_crops")
CENTER_CROPS_PATH = os.path.join(FE_PATH, "center_crops")
FILLER_CROPS_PATH = os.path.join(FE_PATH, "filler_crops")
OOPS_PATH = "/home/anelise/datasets/oops_dataset/oops_video/val"


def load_mems():
    with open(SCORES_PATH) as infile:
        scores = json.load(infile)

    return scores


def load_lens():
    with open(LENS_PATH) as infile:
        lens = json.load(infile)

    return lens


def get_memorable_crop(mems):
    # find the most memorable moment
    max_indices = np.argwhere(mems == np.amax(mems)).flatten()
    # choose one that's not index 0 or len(mems) -1, if that exists
    selected_i = max_indices[0]

    for i in max_indices:
        if i > 0 and i < len(mems) - 1:
            selected_i = i

            break

    start_crop = max(0, selected_i - 1)

    return start_crop


def get_vid_length(vidpath):
    cap = cv2.VideoCapture(vidpath)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    return frame_count / fps


def get_vid_aspect_ratio(vidpath):
    cap = cv2.VideoCapture(vidpath)
    w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)

    return w / h


def get_center_crop(vidpath):
    vidlength = get_vid_length(vidpath)
    assert vidlength >= 3
    center = math.floor(vidlength / 2)
    start_crop = center - 1

    return start_crop


def overlapping_mem_and_center_crop(vidname, mems):
    vidpath = os.path.join(OOPS_PATH, vidname + '.mp4')
    center_crop_start = get_center_crop(vidpath)
    mem_crop_start = get_memorable_crop(mems)

    return abs(center_crop_start - mem_crop_start) <= 3


def crop_video(vid_path, start_crop, savepath, duration=3):
    fname, ext = os.path.splitext(vid_path)

    fmt_str = "%H:%M:%S"
    start_string = datetime.time(second=start_crop).strftime(fmt_str)
    end_string = datetime.time(second=duration).strftime(fmt_str)
    print("start string", start_string)
    print("end string", end_string)

    # the -y allows overwriting existing files
    # -strict -2 supresses an error involving the aac audio codec
    args = [
        "ffmpeg", "-y", "-i", vid_path, "-ss", start_string, "-t", end_string,
        "-strict", "-2", savepath
    ]
    print("ffmpeg command:", " ".join(args))

    try:
        subprocess.run(args, check=True, stdout=subprocess.DEVNULL)
    except subprocess.CalledProcessError as cpe:
        print("Got an error cropping the video", cpe)
        raise Exception(
            "Error while cropping video {} to indices ({}, {}) using "
            "following command: {}".format(vid_path, start_crop,
                                           start_crop + duration, str(args)))


def select_long_videos(n=16):
    lens = load_lens()

    vids = [elt for elt in lens if elt[0] >= 28 and elt[0] <= 32]
    print(len(vids))

    # select vids w/ highest mem score std. dev.
    scores = load_mems()
    vars = []

    for elt in vids:
        length, vidname = elt
        mem_scores = scores[vidname]["mems"]
        stddev = np.std(mem_scores)
        vars.append([stddev, vidname])

    vars.sort()

    vids_to_select = []

    for vid in vars[::-1]:
        _, vidname = vid

        has_overlap = overlapping_mem_and_center_crop(vidname,
                                                      scores[vidname]["mems"])

        has_good_ar = get_vid_aspect_ratio(
            os.path.join(OOPS_PATH, vidname + ".mp4")) > 1

        if (not has_overlap) and has_good_ar:
            vids_to_select.append(vidname)
        else:
            print("{}: {}, {}".format(vidname, has_overlap, has_good_ar))

        if len(vids_to_select) == n:
            break

    # clear the folder

    if os.path.exists(LONG_VIDS_PATH):
        shutil.rmtree(LONG_VIDS_PATH)
    os.makedirs(LONG_VIDS_PATH)

    for vid in tqdm(vids_to_select):
        dest = os.path.join(LONG_VIDS_PATH, vid + ".mp4")
        src = os.path.join(OOPS_PATH, vid + ".mp4")
        shutil.copyfile(src, dest)

    print("Done")


def make_target_crops():
    scores = load_mems()
    mem_vids = os.listdir(LONG_VIDS_PATH)

    if not os.path.exists(MEM_CROPS_PATH):
        os.makedirs(MEM_CROPS_PATH)

    if not os.path.exists(CENTER_CROPS_PATH):
        os.makedirs(CENTER_CROPS_PATH)

    for vid in tqdm(mem_vids):
        vidname = os.path.splitext(vid)[0]
        vidpath = os.path.join(LONG_VIDS_PATH, vid)
        mem_savepath = os.path.join(MEM_CROPS_PATH, vid)
        center_savepath = os.path.join(CENTER_CROPS_PATH, vid)
        mem_scores = scores[vidname]["mems"]

        start_mem_crop = get_memorable_crop(mem_scores)
        crop_video(vidpath, start_mem_crop, mem_savepath)

        start_center_crop = get_center_crop(vidpath)
        crop_video(vidpath, start_center_crop, center_savepath)

    print("Done.")


def select_filler_crops(n):
    lens = load_lens()

    target_vids = [
        os.path.splitext(fname)[0] for fname in os.listdir(LONG_VIDS_PATH)
    ]

    potential_fillers = [elt for elt in lens if elt[1] not in target_vids]
    assert len(potential_fillers) == len(lens) - len(target_vids)
    print("Found {} potential fillers".format(len(potential_fillers)))

    # How to select fillers? Take ones w/ length > 4
    potential_fillers = [elt for elt in potential_fillers if elt[0] >= 20]
    print("Narrowed to {} potential fillers".format(len(potential_fillers)))

    # take one w/ good ar
    def has_good_ar(vidname):
        vidpath = os.path.join(OOPS_PATH, vidname + ".mp4")

        return get_vid_aspect_ratio(vidpath) > 1

    potential_fillers = [
        elt for elt in potential_fillers if has_good_ar(elt[1])
    ]
    print("Narrowed to {} potential fillers".format(len(potential_fillers)))

    # Randomly select a certain number from the list
    n_final = min(len(potential_fillers), n)
    print("SELECTING {} FILLERS".format(n_final))
    selected_fillers = random.sample(potential_fillers, k=n_final)

    return [elt[1] for elt in selected_fillers]


def make_filler_crops(n=200):
    # step 1: select some filler vids
    selected_fillers = select_filler_crops(n)

    # step 2: prep the directory

    if os.path.exists(FILLER_CROPS_PATH):
        shutil.rmtree(FILLER_CROPS_PATH)
    os.makedirs(FILLER_CROPS_PATH)

    # step 3: crop them

    for vidname in selected_fillers:
        vidpath = os.path.join(OOPS_PATH, vidname + '.mp4')
        savepath = os.path.join(FILLER_CROPS_PATH, vidname + '.mp4')
        center_crop_start = get_center_crop(vidpath)
        crop_video(vidpath, center_crop_start, savepath)

    print("Done.")


if __name__ == "__main__":
    # select_long_videos()
    # make_target_crops()
    make_filler_crops()
