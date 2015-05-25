#!/usr/bin/env python

import freenect
import matplotlib.pyplot as plt
from scipy.signal import argrelmax
import signal
import numpy as np
import cv2
from numpy import array, abs, clip, unravel_index, argmax, nanargmax, isnan
from numpy.linalg import norm
from sys import stdout
from time import time

plt.ion()

keep_running = True



do_depth_plot = False
do_time = False

#do_depth_plot = True
#do_time = True

kern_size = 50

df_lim = 0.08


def in_place_normalize(d):
  clip(d, 0, 2**10 - 1, d)
  top = d.max()
  bottom = d.min()
  d[:,:] = (d[:,:]-bottom) / (top-bottom)

def in_place_smooth(d):
  d[:,:] = cv2.blur(d,(kern_size, kern_size))


def get_depth():

  data_prev = np.zeros(shape=(480,640), dtype='float')
  data = np.zeros(shape=(480,640), dtype='float')
  df = np.zeros(shape=(480,640), dtype='float')
  h,w = data_prev.shape
  h = float(h)
  w = float(w)
  xy_prev = [0.,0.]
  m_prev = [0]
  itt = [0]
  times = []

  def depth(dev, in_data, timestamp):
    
    global keep_running

    t0 = time()
    itt[0] += 1

    data[:] = in_data[:,::-1]
    in_place_normalize(data)
    in_place_smooth(data)

    df[:] = abs(data-data_prev)[:]
    #df[isnan(df)] = 0.0
    df[df<0.1] = 0.0

    pm = argmax(df)
    j,i = unravel_index(pm, (h,w))
    m = data[j,i]

    xy = array([i/w,j/h])

    data_prev[:] = data[:]
    xy_prev[:] = xy
    m_prev[0] = m

    if df[j,i]>df_lim:
      stdout.write('{:f};{:f};{:d};'.format(xy[0],xy[1],itt[0]))
      stdout.flush()

    if do_time:
      print('time:', time()-t0)

    if not do_depth_plot:
      return

    plt.figure(1)
    plt.gray()
    plt.imshow(data, interpolation='nearest', animated=True)
    plt.xlim([0,w])
    plt.ylim([h,0])
    plt.tight_layout()
    plt.draw()

    plt.figure(2)
    plt.gray()
    plt.clf()


    plt.imshow(df, interpolation='nearest', animated=True)
    plt.xlim([0,w])
    plt.ylim([h,0])
    plt.tight_layout()

    #relmax = argrelmax(df)
    #plt.plot(relmax[1], relmax[0], 'go', ms=10)

    if df[j,i]>df_lim:
      plt.plot(i,j, 'ro', ms=20)
      print('*'*40)

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

