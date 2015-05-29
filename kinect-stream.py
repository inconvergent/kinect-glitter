#!/usr/bin/env python

import freenect
import matplotlib.pyplot as plt
from scipy.signal import argrelmax
import signal
import numpy as np
from numpy import array, abs, \
                  clip, unravel_index, argmax, nanargmax, isnan,\
                  concatenate, cross, reshape, nanmax

from scipy import ndimage

from sklearn.cluster import DBSCAN

from numpy.linalg import norm

from sklearn.feature_extraction import image as cluster_image
from sklearn.cluster import spectral_clustering

from sys import stdout
from time import time

plt.ion()

h = 480.
w = 640.

keep_running = True



do_depth_plot = False
do_time = False

do_depth_plot = True
#do_time = True

kern_size = 40

df_lim = 0.9


#def in_place_normalize(d):
  #clip(d, 0, 2**10 - 1, d)
  #top = d.max()
  #bottom = d.min()
  #d[:,:] = (d[:,:]-bottom) / (top-bottom)

def get_depth():
  
  data_prev = np.zeros(shape=(h,w), dtype='float')
  data = np.zeros(shape=(h,w), dtype='float')

  shadowmask = np.zeros(shape=(h,w), dtype='bool')
  shadowmask_prev = np.zeros(shape=(h,w), dtype='bool')

  image = np.zeros(shape=(h,w,3), dtype='float')

  df = np.zeros(shape=(h,w), dtype='float')
  xy_prev = array([0.,0.])
  xy = array([0.,0.])
  m_prev = [0]
  itt = [0]
  times = []
  points = []


  if do_depth_plot:
    plt.figure(1)
    image[10,11,:] = 1
    image[10,10,:] = 0
    handle = plt.imshow(image, interpolation='nearest', animated=True)
    plt.xlim([0,w])
    plt.ylim([h,0])
    plt.tight_layout()

  def depth(dev, in_data, timestamp):
    
    t0 = time()
    itt[0] += 1

    data[:] = in_data[:,::-1].astype('float')

    shadowmask_prev[:] = shadowmask[:]
    shadowmask[:] = data>=2047.

    shadowmask_tot = np.logical_or(shadowmask_prev, shadowmask)
    not_shadow = np.logical_not(shadowmask_tot)

    data[:] /= 2047.
    #data[:] = ndimage.gaussian_filter(data, 2)
    #data[:] = ndimage.uniform_filter(data, 4)


    df[:] =  abs(data_prev[:] - data[:])
    df[:] /= df.max()
    adf = ndimage.grey_erosion(df,20)
    adf[:] /= adf.max()

    ji = argmax(adf)
    j,i = unravel_index(ji, (h,w))

    xy[:] = [i/w,j/h]
    data_prev[:] = data[:]

    image[:] = 0.

    image[:,:,0] = adf
    image[not_shadow,1] = data[not_shadow]
    image[not_shadow,2] = data[not_shadow]

    handle.set_data(image) 

    try:
      l = points.pop()
      l.remove()
    except IndexError:
      pass

    if adf[j,i]>df_lim:
      new_l = plt.plot(i,j, 'ro', ms=20)
      points.extend(new_l)

    plt.draw()

    return

  return depth

def body(*args):
    if not keep_running:
        raise freenect.Kill


def handler(signum, frame):
    global keep_running
    keep_running = False


print('Press Ctrl-C in terminal to stop')
signal.signal(signal.SIGINT, handler)
freenect.runloop(depth=get_depth(),
                 body=body)

