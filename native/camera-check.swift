import CoreMediaIO

var prop = CMIOObjectPropertyAddress(
  mSelector: CMIOObjectPropertySelector(kCMIOHardwarePropertyDevices),
  mScope: CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),
  mElement: CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain)
)

var dataSize: UInt32 = 0
CMIOObjectGetPropertyDataSize(CMIOObjectID(kCMIOObjectSystemObject), &prop, 0, nil, &dataSize)
let count = Int(dataSize) / MemoryLayout<CMIOObjectID>.size
var devices = [CMIOObjectID](repeating: 0, count: count)
CMIOObjectGetPropertyData(CMIOObjectID(kCMIOObjectSystemObject), &prop, 0, nil, dataSize, &dataSize, &devices)

for device in devices {
  // Check if device is running somewhere
  var runningProp = CMIOObjectPropertyAddress(
    mSelector: CMIOObjectPropertySelector(kCMIODevicePropertyDeviceIsRunningSomewhere),
    mScope: CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),
    mElement: CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain)
  )
  var running: UInt32 = 0
  var runSize = UInt32(MemoryLayout<UInt32>.size)
  CMIOObjectGetPropertyData(device, &runningProp, 0, nil, runSize, &runSize, &running)

  guard running == 1 else { continue }

  // Get device name
  var nameProp = CMIOObjectPropertyAddress(
    mSelector: CMIOObjectPropertySelector(kCMIOObjectPropertyName),
    mScope: CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),
    mElement: CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain)
  )
  var nameSize = UInt32(MemoryLayout<CFString>.size)
  var name: Unmanaged<CFString>?
  CMIOObjectGetPropertyData(device, &nameProp, 0, nil, nameSize, &nameSize, &name)

  if let n = name?.takeUnretainedValue() {
    print(n)
  }
}
