#!/usr/bin/env python

import freenect
import matplotlib.pyplot as plt
from scipy.signal import argrelmax
import signal
import numpy as np
import cv2
from numpy import array, abs, \
                  clip, unravel_index, argmax, nanargmax, isnan,\
                  concatenate, cross, reshape
from numpy.linalg import norm
from sys import stdout
from time import time

plt.ion()

h = 480.
w = 640.

keep_running = True



do_depth_plot = False
do_time = False

#do_depth_plot = True
#do_time = True

kern_size = 40

df_lim = 0.1


def in_place_normalize(d):
  clip(d, 0, 2**10 - 1, d)
  top = d.max()
  bottom = d.min()
  d[:,:] = (d[:,:]-bottom) / (top-bottom)

def in_place_smooth(d):
  d[:,:] = cv2.blur(d,(kern_size, kern_size))


def set_normals(normals,d,kern=3):

  data = cv2.blur(d,(kern, kern))
  s = 2.0/w
  dfx = np.zeros(shape=(h,w,3), dtype='float')
  dfy = np.zeros(shape=(h,w,3), dtype='float')
  dfx[:,:,0] = s
  dfx[1:,1:,2] = -(data[1:,1:]-data[:-1,1:])/s
  dfy[:,:,1] = s
  dfy[1:,1:,2] = -(data[1:,1:]-data[1:,:-1])/s
  normals[:,:,:] = cross(dfx,dfy)
  normals[:] = 0.5 + 0.5*normals/reshape(norm(normals, axis=2), (h,w,1))

def get_depth():
  
  data_prev = np.zeros(shape=(h,w), dtype='float')
  data = np.zeros(shape=(h,w), dtype='float')
  image = np.zeros(shape=(h,w,3), dtype='float')

  normals = np.zeros(shape=(h,w,3), dtype='float')
  df = np.zeros(shape=(h,w), dtype='float')
  xy_prev = array([0.,0.])
  xy = array([0.,0.])
  m_prev = [0]
  itt = [0]
  times = []

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

    data[:] = in_data[:,::-1]

    in_place_normalize(data)

    shadowmask = data >= 1.0
    #set_normals(normals,data,kern=200)

    in_place_smooth(data)

    df[:] = data_prev[:] - data[:]
    df[df<0.05] = 0.0

    pm = argmax(df)
    j,i = unravel_index(pm, (h,w))
    m = data[j,i]

    xy[:] = [i/w,j/h]

    data_prev[:] = data[:]
    xy_prev[:] = xy[:]
    m_prev[0] = m

    if df[j,i]>df_lim:
      stdout.write('{:f};{:f};{:d};'.format(xy[0],xy[1],itt[0]))
      stdout.flush()

    if do_time:
      print('\ntime: {:1.5f}s'.format(time()-t0))

    if not do_depth_plot:
      return

    #image[:,:,0] = data
    #image[:,:,1] = data
    #image[:,:,2] = data

    image[:,:,0] = df/df.max()
    image[:,:,1] = data
    image[:,:,2] = 1.0
    image[shadowmask,2] = 0.0

    handle.set_data(image) 

    if df[j,i]>df_lim:
      plt.plot(i,j, 'ro', ms=20)
      #print('*'*40)

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

