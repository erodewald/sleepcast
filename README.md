# sleepcast

A SmartThings webhook automation that allows you to control your (modern) Vizio TV with your SmartThings switches or mode changes. A major goal is to develop a wearables companion app that can perform these functions at optimum times based on your heart rate and sleep status.

## Project goals

### Feature goals

Note: **Config UI** is the SmartThings SmartApp configuration interface found in the SmartThings mobile app.

| Feature goal                               | Function | Config UI | Issue                                                       |
| ------------------------------------------ | -------- | --------- | ----------------------------------------------------------- |
| Connect to TV by LAN IP                    | ✅       | ✅        |                                                             |
| Connect to TV by WAN URL/IP                | ✅       | ✅        |                                                             |
| Discover TV by SSDP (LAN)                  | ✅       | ✅        |                                                             |
| Trigger via device event                   | ✅       | ✅        |                                                             |
| Trigger via scene event                    | 🚫       | 🚫        | TBD – not sure if this will ever be possible                |
| Trigger via mode event                     | ✅       | ✅        |                                                             |
| Toggle power                               | ✅       | ✅        |                                                             |
| Set volume                                 | ✅       | ✅        |                                                             |
| Fade volume over time                      | 🚫       | ✅        |                                                             |
| Set sleep timer                            | ✅       | ✅        | [vizio-smart-cast/12](/heathbar/vizio-smart-cast/issues/12) |
| Set picture mode                           | ✅       | ✅        | [vizio-smart-cast/12](/heathbar/vizio-smart-cast/issues/12) |
| Set backlight percentage                   | ✅       | ✅        |                                                             |
| Fade backlight percentage over time        | 🚫       | ✅        | TBD                                                         |
| Set blank screen                           | ✅       | ✅        | [vizio-smart-cast/12](/heathbar/vizio-smart-cast/issues/12) |
| Create Samsung Gear wearable companion app | 🚫       | N/A       | TBD                                                         |
| Get heart rate/sleep status from wearable  | 🚫       | 🚫        | TBD                                                         |
| Use HR to auto-shut off TV                 | 🚫       | 🚫        | TBD                                                         |
| Trigger actions w/ SmartThings scheduler   | 🚫       | N/A       | TBD                                                         |
