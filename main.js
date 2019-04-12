#!/usr/bin/env nodejs
const path = require('path')
const Smartcast = require('vizio-smart-cast')
const express = require('express')
const SmartApp = require('@smartthings/smartapp')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const moment = require('moment')
const voca = require('voca')

const app = express()
const firebase = require('firebase')
const atob = require('atob')
const FirestoreDBContextStore = require('./firestore-context-store')
const firebaseServiceAccount = require('./googleservices-sleepcast-219202-a2324461b918.json')
const firebaseAppConfig = require('./firebase-sleepcast.json')
const {App, Pages, Configs} = require('./constants')

firebase.initializeApp(firebaseAppConfig)
const auth = firebase.auth()
const smartapp = new SmartApp()
smartapp
  .contextStore(new FirestoreDBContextStore(firebaseServiceAccount, 'installedapps'))
  .publicKey(App.PUBLIC_KEY)
  .enableEventLogging(2, true)
  .appId(App.SMARTAPP_ID)
  .clientId(App.CLIENT_ID)
  .clientSecret(App.CLIENT_SECRET)
  .permissions(App.PERMISSIONS.split(' '))
  .disableCustomDisplayName(true)
  .firstPageId(Pages.INTRO)
  .configureI18n({
    updateFiles: false,
    locales: ['en'],
    directory: path.join(__dirname, '/locales')
  })
  .page(Pages.INTRO, (context, page, _) => {
    const existingVizio = context.configStringValue(Configs.VIZIO_HOST)
    const existingActions = []
    const existingStTriggers = []
    const existingWearableTriggers = []

    if (context.hasConfig(Configs.PRESENCES)) {
      existingStTriggers.push({
        presences: context.configDeviceValue({name: Configs.PRESENCES, templated: true})
      })
    }

    if (context.hasConfig(Configs.MODES)) {
      existingStTriggers.push({
        modes: context.configModeIds({name: Configs.MODES, templated: true})
      })
    }

    // Config settings
    const settingsKeys = [Configs.VOLUME, Configs.PICTURE, Configs.SLEEP, Configs.BLANK_SCREEN, Configs.RESTORE_VALUES]
    for (const key of settingsKeys) {
      if (context.hasConfig(key)) {
        const name = key
        existingActions.push({
          [name]: context.configStringValue(key)
        })
      }
    }

    const stMsg = existingStTriggers
      .map(c => {
        const prop = Object.keys(c)[0]
        return `${voca.titleCase(prop)}: ${c[prop]}`
      })
      .join(' • ')

    const actionsMsg = existingActions
      .map(c => {
        const prop = Object.keys(c)[0]
        return `${voca.titleCase(prop)}: ${c[prop]}`
      })
      .join(' • ')
    const vizioMsg = existingVizio ?
      `Connected to ${existingVizio}` :
      existingVizio

    // Define section states
    const hasTrigger = existingStTriggers.length > 0 || existingWearableTriggers.length > 0
    const hasAction = existingActions.length > 0

    page.complete(hasAction && existingVizio && hasTrigger)
    page.defaultRequired(false)
    page.section('header', section => {
      section.name(undefined)
      section.imageSetting().image(App.PATTERN)

      // TEST...how does this work? Nothing shows up
      // section.imagesSetting().images([
      //   `${App.BASE_URL}/images/watch-hr.png`,
      //   `${App.BASE_URL}/images/watch.png`,
      //   `${App.BASE_URL}/images/wrigglies.png`
      // ])
    })
    page.section('action_devices', section => {
      section
        .pageSetting('to_vizio_setup_page')
        .page(Pages.VIZIO_SETUP)
        .image(`${App.BASE_URL}/images/logo-vizio.png`)
        .style(existingVizio ? 'COMPLETE' : 'DEFAULT')
        .description(() => vizioMsg || 'Supported models: 2016+ Smartcast')
    })
    page.section('triggers', section => {
      section
        .pageSetting('to_wearable_setup_page')
        .page(Pages.TRIGGER_WEARABLE_SETUP)
        .image(`${App.BASE_URL}/images/watch-hr-square.png`)
      section
        .pageSetting('to_st_setup_page')
        .page(Pages.TRIGGER_ST_SETUP)
        .image(`${App.BASE_URL}/images/logo-st_128.png`)
        .style(stMsg ? 'COMPLETE' : 'DEFAULT')
        .description(() => existingStTriggers ? stMsg : 'Recommended. Use SmartThings events as a trigger')
    })
    page.section('configure_actions', section => {
      section
        .pageSetting('to_app_setup_page')
        .page(Pages.APP_SETUP)
        .style(actionsMsg ? 'COMPLETE' : 'DEFAULT')
        .image(`${App.BASE_URL}/images/icon-settings.png`)
        .description(() => existingActions ? actionsMsg : 'Choose what should happen when sleep mode begins')
        .disabled(!existingVizio)
    })
    page.section('extend_functionality', section => {
      section
        .oauthSetting('oauth_out')
        .urlTemplate(`${App.BASE_URL}/authorize?client_id=${App.CLIENT_ID}&redirect_uri=https%3A%2F%2Fapi.smartthings.com%2Foauth%2Fcallback`)
    })
    page.section('footer', section => {
      section.style('FOOTER')
      section
        .linkSetting('help')
        .url(App.BASE_URL)
      section
        .pageSetting('to_debug_page')
        .page(Pages.DEBUG)
    })
  })
  .page(Pages.VIZIO_SETUP, (context, page, _) => {
    page.previousPageId(Pages.INTRO)
    page.defaultRequired(false)
    page.section('setup_method', section => {
      section.imageSetting().image(`${App.BASE_URL}/images/pair-device.png`)
      section
        .pageSetting('to_vizio_setup_auto_page')
        .image(`${App.BASE_URL}/images/pair-auto.png`)
        .page(Pages.VIZIO_SETUP_AUTO)
      section
        .pageSetting('to_vizio_setup_manual_page')
        .image(`${App.BASE_URL}/images/pair-manual.png`)
        .page(Pages.VIZIO_SETUP_MANUAL)
    })
  })
  // TODO: this page's functionality is totally broken
  .page(Pages.VIZIO_SETUP_AUTO, async (context, page, _) => {
    const Smartcast = require('vizio-smart-cast')
    let device
    page.defaultRequired(false)
    Smartcast.discover(
      success => {
        console.log('Discovery success')
        device = success
        page.nextPageId(Pages.VIZIO_SETUP_PAIRING)
        page.previousPageId(Pages.VIZIO_SETUP)
        page.section('discovery', section => {
          section.imageSetting().image(`${App.BASE_URL}/images/like.png`)
          section.paragraphSetting('discoverySuccess')
          section
            .textSetting(Configs.VIZIO_HOST)
            .required(true)
            .defaultValue(device.ip)
        })
      },
      error => {
        console.error('Error', error)
      }
    )
    setTimeout(() => {}, 5000)
    console.log('callback exited')
  })
  .page(Pages.VIZIO_SETUP_MANUAL, (context, page, _) => {
    page.defaultRequired(false)
    page.nextPageId(Pages.VIZIO_SETUP_PAIRING)
    page.previousPageId(Pages.VIZIO_SETUP)
    page.section('pairing', section => {
      section.paragraphSetting('tip')
      section
        .textSetting(Configs.VIZIO_HOST)
        .image(`${App.BASE_URL}/images/hostname.png`)
        .required(true)
    })
  })
  .page(Pages.VIZIO_SETUP_PAIRING, async (context, page, data) => {
    const Smartcast = require('vizio-smart-cast')
    page.defaultRequired(false)
    try {
      const vizioIp = context.configStringValue(Configs.VIZIO_HOST)
      const tv = new Smartcast(vizioIp)
      const initiate = await tv.pairing.initiate(App.SMARTAPP_NAME, data.installedAppId)
      context.injectConfig({vizioPairingRequestToken: initiate.ITEM.PAIRING_REQ_TOKEN})

      // Success
      page.nextPageId(Pages.VIZIO_SETUP_PAIRING_2)
      page.previousPageId(Pages.VIZIO_SETUP)
      page.section('pairing', section => {
        section.paragraphSetting('tip')
        section.numberSetting(Configs.VIZIO_PAIRING_CODE).required(true)
      })
    } catch (error) {
      page.previousPageId(Pages.VIZIO_SETUP_MANUAL)
      page.section('status', section => {
        section.paragraphSetting('failed').description(error)
        section.imageSetting().image(`${App.BASE_URL}/images/dislike.png`)
      })
    }
  })
  .page(Pages.VIZIO_SETUP_PAIRING_2, async (context, page, data) => {
    const Smartcast = require('vizio-smart-cast')
    try {
      const vizio = context.configStringValue(Configs.VIZIO_HOST)
      if (!vizio) {
        throw new Error('Vizio hostname is missing')
      }

      const tv = new Smartcast(vizio)
      const code = context.configStringValue(Configs.VIZIO_PAIRING_CODE)
      const requestToken = context.configInjectedValue(Configs.VIZIO_PAIRING_REQ_TOKEN)
      const deviceId = data.installedAppId

      const pair = await tv.pairing.pair(code, deviceId, requestToken)

      if (pair.STATUS.RESULT === 'SUCCESS') {
        context.injectConfig({vizioAuthToken: pair.ITEM.AUTH_TOKEN})
        page.nextPageId(Pages.INTRO)
        page.previousPageId(Pages.INTRO)
        page.nextText('Continue')
        page.style('SPLASH')
        page.section('main', section => {
          section.paragraphSetting('success')
        })
      }

      if (pair.STATUS.RESULT === 'BLOCKED') {
        console.log('pairing status BLOCKED')
      }
    } catch (error) {
      page.nextPageId(null)
      page.previousPageId(Pages.VIZIO_SETUP)
      page.section('main', section => {
        section.paragraphSetting('failed').description(error)
      })
    }
  })
  .page(Pages.TRIGGER_WEARABLE_SETUP, (context, page, _) => {
    page.defaultRequired(false)
    page.previousPageId(Pages.INTRO)
    page.section('how', section => {
      section.imageSetting().image(`${App.BASE_URL}/images/watch-hr.png`)
      section.paragraphSetting('how_it_works')
      section.paragraphSetting('supported_models')
    })
    page.section('where', section => {
      section
        .linkSetting('install')
        .image(`${App.BASE_URL}/images/install.png`)
        .url('https://install-sleepcast-samsung.erode.tv')
    })
  })
  .page(Pages.APP_SETUP, async (context, page, _) => {
    page.defaultRequired(false)
    page.previousPageId(Pages.INTRO)
    page.nextPageId(Pages.INTRO)

    const authToken = context.configInjectedValue(Configs.VIZIO_AUTH_TOKEN)
    const hostname = context.configStringValue(Configs.VIZIO_HOST)
    if (authToken && hostname) {
      try {
        const tv = new Smartcast(hostname, authToken)
        const picture = await tv.settings.picture.mode.get()
        const pictureModeEnum = picture.ITEMS.find(x => x.CNAME === 'picture_mode').ELEMENTS.map(x => ({id: x, name: x}))
        const volume = await tv.control.volume.get()
        const backlight = await tv.settings.picture.backlight.get()

        // Await tv.settings.picture.backlight.set(++backlight)

        page.section('audio', section => {
          section
            .paragraphSetting('audio_warning')
          section
            .numberSetting(Configs.VOLUME)
            .postMessage('%')
            .style('SLIDER')
            .min(0)
            .max(25)
            .step(1)
            .required(false)
          section
            .numberSetting(Configs.VOLUME_FADE)
            .postMessage(' mins')
            .step(1)
            .min(1)
            .max(180)
            .style('SLIDER')
            .disabled(!volume)
            .required(false)
        })
        page.section('power', section => {
          section
            .numberSetting(Configs.SLEEP)
            .postMessage(' mins')
            .style('SLIDER')
            .step(30)
            .min(0)
            .max(180)
            .required(false)
        })
        page.section('picture', section => {
          section
            .enumSetting(Configs.PICTURE)
            .required(false)
            .options(pictureModeEnum)
          section
            .numberSetting(Configs.BACKLIGHT)
            .postMessage('%')
            .step(1)
            .min(1)
            .max(100)
            .style('SLIDER')
            .submitOnChange(true)
          section
            .numberSetting(Configs.BACKLIGHT_FADE)
            .postMessage(' mins')
            .style('SLIDER')
            .step(1)
            .min(1)
            .max(120)
            .disabled(!backlight)
            .required(false)
          section
            .booleanSetting(Configs.BLANK_SCREEN)
            .required(false)
        })
        page.section('extras', section => {
          section.booleanSetting(Configs.RESTORE_VALUES)
        })
      } catch (error) {}
    } else {
      page.previousPageId(Pages.INTRO)
      page.defaultRequired(false)
      page.section('main_fail', section => {
        section.imageSetting().image(`${App.BASE_URL}/images/yoga.png`)
        section.paragraphSetting('failed')
      })
    }
  })
  .page(Pages.TRIGGER_ST_SETUP, (context, page, _) => {
    page.defaultRequired(false)
    page.previousPageId(Pages.INTRO)
    const quietStart = context.configTimeString(Configs.QUIET_START)
    page.section('triggers', section => {
      section
        .modeSetting(Configs.MODES)
        .required(false)
        .multiple(false)
      section
        .deviceSetting(Configs.SWITCHES)
        .required(false)
        .capability('switch')
        .permissions(['r'])
        .multiple(true)
    })
    page.section('conditions', section => {
      section
        .deviceSetting(Configs.PRESENCES)
        .required(false)
        .capabilities(['presenceSensor'])
        .permissions(['r'])
        .multiple(true)
      section
        .timeSetting(Configs.QUIET_START)
        .required(false)
        .submitOnChange(true)
      // Why submitOnChange? To dynamically enable quietEnd
      section
        .timeSetting(Configs.QUIET_END)
        .required(Boolean(quietStart))
        .disabled(Boolean(!quietStart))
    })
  })
  .page(Pages.DEBUG, (context, page, _) => {
    page.previousPageId(Pages.INTRO)
    page.defaultRequired(false)
    page.section('config', section => {
      for (const key of Object.keys(context.config)) {
        const entry = context.config[key]
        section
          .paragraphSetting()
          .text(() => key)
          .description(() => `${JSON.stringify(entry, null, '\t')}`)
      }
    })
  })
  .updated((context, updateData) => {
    createSubscriptions(context, updateData)
  })
  .oauthHandler(async (context, callbackData) => {
    await handleOauth(callbackData)
  })
  // UNINSTALLED: Note: Our Firebase Firestore context removes the installedAppId automatically
  /* All subscription event handler types:
   *   - DEVICE_EVENT (context, deviceEvent)
   *   - TIMER_EVENT (context, timerEvent)
   *   - DEVICE_COMMANDS_EVENT (context, deviceId, command, deviceCommandsEvent)
   *   - MODE_EVENT (context, modeEvent)
   *   - SECURITY_ARM_STATE_EVENT (context, securityArmStateEvent)
   */
  .subscribedEventHandler('modeChangeHandler', async (context, _) => {
    const modes = context.configModeIds(Configs.MODES)
    console.log(modes)

    // CHECK EVENT CONDITIONS
    // if (modes !== event.modeId) {
    //   console.log('not triggered: wrong mode')
    //   return
    // }

    // CHECK GENERIC CONDITIONS
    checkConditions(context)
  })
  .subscribedEventHandler('switchesChanged', (context, _) => {
    const switches = context.configDevices(Configs.SWITCHES)
    console.log(switches)
    // Maybe check switch(es) status
    checkConditions(context)
  })
  .subscribedEventHandler('presenceChanged', (context, _) => {
    const presences = context.configDevices(Configs.PRESENCES)
    console.log(presences)
    // Maybe check presence statuses
    checkConditions(context)
  })

async function checkConditions(context) {
  const quietStart = new Date(context.configDateValue(Configs.QUIET_START))
  const quietEnd = new Date(context.configDateValue(Configs.QUIET_END))
  const vizio = context.configStringValue(Configs.VIZIO_HOST)
  const vizioToken = context.configInjectedValue(Configs.VIZIO_AUTH_TOKEN)

  if (!vizio || !vizioToken) {
    console.error('not triggered: invalid device connection')
    return
  }

  const tv = new Smartcast(vizio, vizioToken)
  const powerResponse = await tv.power.currentMode()
  const isTvOn = powerResponse.ITEMS.find(i => i.CNAME === 'power_mode').VALUE === 1

  if (!isTvOn) {
    console.log('not triggered: wrong power state')
    return
  }

  const momentQS = moment(quietStart)
  const momentQE = moment(quietEnd)
  if (moment().isBetween(momentQS, momentQE)) {
    console.log('not triggered: inside of quiet hours')
    return
  }
  // Moment().isBefore(quietStart) && moment().isAfter(quietEnd))

  actionsTriggered(context)
}

async function actionsTriggered(context) {
  const vizio = context.configStringValue(Configs.VIZIO_HOST)
  const vizioToken = context.configInjectedValue(Configs.VIZIO_AUTH_TOKEN)
  const tv = new Smartcast(vizio, vizioToken)

  // Brightness
  const cfgBacklight = context.configStringValue(Configs.BACKLIGHT)
  const cfgBacklightFade = context.configBooleanValue(Configs.BACKLIGHT_FADE)
  if (cfgBacklight && !cfgBacklightFade) {
    tv.settings.picture.backlight.set(parseInt(cfgBacklight, 10))
  } else if (cfgBacklight && cfgBacklightFade) {
    // TODO: actually start a task to fade over time
    let backlight = tv.settings.picture.backlight.get()
    await setInterval(async () => {
      if (backlight === 1) {
        return
      }

      tv.settings.picture.backlight.set(--backlight)
    }, 5000)
  }

  // Volume
  const cfgVolume = context.configStringValue(Configs.VOLUME)
  const cfgVolumeFade = context.configStringValue(Configs.VOLUME_FADE)
  if (cfgVolume && !cfgVolumeFade) {
    tv.control.volume
      .set(parseInt(cfgVolume, 10))
      .then(value => console.log('Set volume success', value))
      .catch(error => console.log('Set volume failure', error))
  }

  // Picture
  const cfgPicture = context.configStringValue(Configs.PICTURE)
  if (cfgPicture) {
    tv.settings.picture.mode
      .set(cfgPicture)
      .then(value => console.log('Picture mode success', value))
      .catch(error => console.log('Picture mode failure', error))
  }

  // Sleep Timer
  const cfgSleep = context.configStringValue(Configs.SLEEP)
  if (cfgSleep) {
    tv.settings.timers.sleepTimer
      .set(`${cfgSleep} minutes`)
      .then(value => console.log('Sleep timer success', value))
      .catch(error => console.log('Sleep timer failure', error))
  }

  // Blank screen
  const cfgBlank = context.configBooleanValue(Configs.BLANK_SCREEN)
  if (cfgBlank) {
    tv.settings.timers.blankScreen
      .execute()
      .then(value => console.log('Blank screen success', value))
      .catch(error => console.log('Blank screen failure', error))
  }
}
//     // Check if we need to worry about presence
//     if (presences) {
//       const isPresent = await smartthings.getPresence(presences)
//       if (!isPresent) {
//         console.log('Might\'ve taken action, but presence condition wasn\'t satisfied')
//         return
//       }

//       console.log('Presence condition satisfied, proceeding with actions')
//     }

async function createSubscriptions(context, data) {
  await context.api.subscriptions.unsubscribeAll()

  const {modes, switches, presences} = data.installedApp.config

  if (modes) {
    context.api.subscriptions.subscribeToModeChange()
  }

  if (switches) {
    context.api.subscriptions.subscribeToDevices(switches, 'switch', 'switch.off', 'switchesChanged')
  }

  if (presences) {
    context.api.subscriptions.subscribeToDevices(presences, 'presenceSensor', 'presence.present', 'presenceChanged')
  }
}

/* Register Express options */
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(cookieParser())
app.use(express.static('public'))

/* Set up Pug */
app.set('views', './public/views')
app.set('view engine', 'pug')

/* Register routes */
app.get('/', (req, res) => {
  console.log(req.cookies)
  res.render('index', {
    title: App.SMARTAPP_NAME
  })
})

app.get('/login', (req, res) => {
  res.render('login', {
    firebase,
    auth
  })
})

app.get('/authorize', (req, res) => {
  const user = JSON.parse(atob(req.query.state))
  console.log(user)
  res.render('authorize', {
    clientId: req.query.client_id,
    redirectUri: req.query.redirect_uri,
    state: req.query.state
  })
})

/* Main entry point for lifecycle events */
app.post('/', async (req, res) => {
  smartapp.handleHttpCallback(req, res)
})

app.listen(process.env.PORT, () => {
  console.log(`${App.SMARTAPP_NAME} running on port ${App.PORT}`)
})

async function handleOauth(callbackData) {
  console.log('Handling oauthData', callbackData)
  const data = {}
  callbackData.urlPath.replace(new RegExp(/([^?=&]+)(=([^&]*))?/, 'g'), ($0, $1, $2, $3) => {
    data[$1] = $3
  })

  if (!data.credential) {
    return
  }

  data.credential = JSON.parse(atob(data.credential))
}
