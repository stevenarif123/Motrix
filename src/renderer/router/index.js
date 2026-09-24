import Vue from 'vue'
import Router from 'vue-router'

import Main from '@/components/Main'
import TaskIndex from '@/components/Task/Index'
import PreferenceIndex from '@/components/Preference/Index'
import PreferenceSubnav from '@/components/Subnav/PreferenceSubnav'
import Basic from '@/components/Preference/Basic'
import Advanced from '@/components/Preference/Advanced'
import Lab from '@/components/Preference/Lab'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'main',
      component: Main,
      children: [
        {
          path: '/task',
          alias: '/',
          component: TaskIndex,
          props: {
            status: 'active'
          }
        },
        {
          path: '/task/:status',
          name: 'task',
          component: TaskIndex,
          props: true
        },
        {
          path: '/preference',
          name: 'preference',
          component: PreferenceIndex,
          props: true,
          children: [
            {
              path: 'basic',
              alias: '',
              components: {
                subnav: PreferenceSubnav,
                form: Basic
              },
              props: {
                subnav: { current: 'basic' }
              }
            },
            {
              path: 'advanced',
              components: {
                subnav: PreferenceSubnav,
                form: Advanced
              },
              props: {
                subnav: { current: 'advanced' }
              }
            },
            {
              path: 'lab',
              components: {
                subnav: PreferenceSubnav,
                form: Lab
              },
              props: {
                subnav: { current: 'lab' }
              }
            }
          ]
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
