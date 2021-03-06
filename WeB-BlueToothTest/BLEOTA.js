var server;
var NetworkStatusChar;
var ControlPointchar;
// Service and characteristic UUIDs
const Commisioning_Service_uuid = '61109d9d-0000-4eac-8c79-51c630e528aa';
const Commisioning_NetworkStatus_uuid = '61109d9d-0005-4eac-8c79-51c630e528aa';
const Firmware_Service_uuid = 'b8843add-0000-4aa1-8794-c3f462030bda'
const NwStatus_uuid = 'b8843add-0001-4aa1-8794-c3f462030bda'
const ControlPoint_uuid = 'b8843add-0002-4aa1-8794-c3f462030bda'
const ImageWrite_uuid = 'b8843add-0003-4aa1-8794-c3f462030bda'
const NumImages_uuid = 'b8843add-0004-4aa1-8794-c3f462030bda'

var ImageWritechar = null;


// Indication Opcodes
const GetImageInfoResponse = 0x80;
const ImageValidationResult = 0x81;
const ImageUpgradeResult = 0x82;
const ImageDataRequest = 0x83;

// Write Request OpCodes
const GetImageInfo = 0x00;
const StartUpgrade = 0x01;
const AbortUpgrade = 0x02;
const ValidateImage = 0x03;
const ApplyUpgrade = 0x04;



// OTA File buffer
var OTABuffer = null;
var FileSize = 0;
var FileVersion_dec = 0;
var OTAFileVersionBuf = null;
var FileSizeBuffer = null;

// OTA Transfer Variables
var chunkSize = 100;
var clearedToSend = true;


// display console.log()

function displayLog(value) {
  document.getElementById("LogArea").value = value;
}

function showFile(input) {

  var OTAFile = input.files[0];
  let reader = new FileReader();

  console.log(`File name: ${OTAFile.name} Size : ${OTAFile.size / 1024} Kb`);
  FileSize = OTAFile.size;
  reader.onload = function(e) {
    var arrayBuffer = reader.result;
    //console.log("Done reading file")
    OTABuffer = new Uint8Array(arrayBuffer);
    //console.log(OTABuffer)
    OTAFileVersionBuf = OTABuffer.slice(14, 18)
    let dataview = new DataView(OTAFileVersionBuf.buffer);
    FileVersion = dataview.getUint32(0, true)
    console.log("OTA File Version : " + FileVersion)

  }
  reader.readAsArrayBuffer(OTAFile)

  console.log("Testing : " + toBytesInt32(16))
  FileSizeBuffer = new Uint8Array(toBytesInt32(FileSize, "little"));
  console.log(FileSizeBuffer)
}

async function SendValidateImageCmd() {
  try {
    // Send Validate Image
    var data = new Uint8Array([ValidateImage, 0x01]);
    await ControlPointchar.writeValue(data);
  } catch (error) {
    console.log('Argh! ' + error);
  }

}




async function BLEOTAProcedure() {
  console.log("Initiating BLE OTA Procedure")

  try {
    // Step 1 Get the current status
    await NetworkStatusChar.readValue().then(value => {
      console.log('> Upgrade Image version: ' + padHex(value.getUint8(1)) + padHex(value.getUint8(2)) + padHex(value.getUint8(3)) + padHex(value.getUint8(4)))
      console.log('> Upgrade Image Offset: ' + padHex(value.getUint8(5)) + padHex(value.getUint8(6)) + padHex(value.getUint8(7)) + padHex(value.getUint8(8)))
      console.log('> Upgrade status : ' + value.getUint8(9));

      // Check if Upload is not currently under progress
      if (value.getUint8(9) != 0) {
        console.log("A Download is Already under Progress!! Aborting");
        return;
      }
    });

    // Get Image info ( Should trigger an Indication)
    var data = new Uint8Array([0x00, 0x00]);
    await ControlPointchar.writeValue(data);

    // Start uploading Image
    var startCode = new Uint8Array([StartUpgrade, 0x00]);
    var BLEBuf = mergeTypedArrays(startCode, OTAFileVersionBuf)
    BLEBuf = mergeTypedArrays(BLEBuf, FileSizeBuffer);
    await ControlPointchar.writeValue(BLEBuf);

  } catch (error) {
    console.log('Argh! ' + error);
  }
}


async function DiscoverRequiredServicesAndChars() {
  console.log("Discovering Required Services and Chars")
  try {
    const FwService = await server.getPrimaryService(Firmware_Service_uuid);
    NetworkStatusChar = await FwService.getCharacteristic(NwStatus_uuid);
    ControlPointchar = await FwService.getCharacteristic(ControlPoint_uuid);
    ImageWritechar = await FwService.getCharacteristic(ImageWrite_uuid);
    const NumberOfImagesChar = await FwService.getCharacteristic(NumImages_uuid);

    // Enable Indications on Control point characteristic
    console.log("Enabling Indications");
    await ControlPointchar.startNotifications();
    ControlPointchar.addEventListener('characteristicvaluechanged', HandleControlPointValueChanged);
    BLEOTAProcedure();
  } catch (error) {
    console.log('Argh! ' + error);
  }

}

async function onButtonClick() {

  var device = null;
  try {
    let options = {
      acceptAllDevices: true,
      optionalServices: [Commisioning_Service_uuid, 'device_information', Firmware_Service_uuid]
    };
    console.log("Requesting Device ...");
    device = await navigator.bluetooth.requestDevice(options);
    console.log("Connecting to  Device ...");
    server = await device.gatt.connect();
    document.getElementById("SelectedDev").innerText = "Connected to Device : " + device.name;
    DiscoverRequiredServicesAndChars();
  } catch (error) {
    console.log('Argh! ' + error);
  }
}

function updateProgressBar(progress) {
  var percentage = (progress * 100) / FileSize;
  //percentage = 100 - percentage;
  var elem = document.getElementById("CurrentProgress");
  elem.style.width = percentage + "%";
}

async function SendOTAFile(index) {
  //var index = 0;
  var remaining = FileSize - index;
  var chunkSize = 200;
  while (index < FileSize) {
    if (clearedToSend) {
      updateProgressBar(remaining)
      console.log("Sending index : " + index + " Remaining :  " + remaining)
      var Offset = new Uint8Array(toBytesInt32(index, "little"));
      var OTAUData = OTABuffer.slice(index, index + chunkSize);
      BLEBuf = mergeTypedArrays(Offset, OTAUData);
      await ImageWritechar.writeValue(BLEBuf);
      if (remaining > chunkSize) {
        index = index + chunkSize;
        remaining = FileSize - (index + chunkSize);
      } else {
        chunkSize = remaining;
        index = index + remaining;
      }
      setTimeout(function() {}, 10);
    } else {
      console.log("Sending Halted at Index  " + index);
      break;
    }
  }

}


function ReStartOTA(newOffset){
  clearedToSend = true;
  SendOTAFile(newOffset)
}

async function HandleControlPointValueChanged(event) {
  var value = event.target.value
  var OpCode = parseInt(padHex(value.getUint8(0)), 16);
  console.log('Received OpCode ' + OpCode);

  switch (OpCode) {
    case GetImageInfoResponse:
      console.log('> Current Image Version: ' + padHex(value.getUint8(5)) + padHex(value.getUint8(4)) + padHex(value.getUint8(3)) + padHex(value.getUint8(2)))
      console.log('> Manufacturer code : ' + padHex(value.getUint8(9)) + padHex(value.getUint8(8)))
      break;

    case ImageValidationResult:
      break;

    case ImageUpgradeResult:
      break;

    case ImageDataRequest:
      console.log(" Reveived message with opcode ImageDataRequest");
      var data = new Uint8Array([value.getUint8(1), value.getUint8(2), value.getUint8(3), value.getUint8(4)]);
      view = new DataView(data.buffer);
      ImageOffset = view.getUint32(0, true);
      console.log("Requested Index " + ImageOffset)

      if (ImageOffset == 0) {
        // Start Loop
        SendOTAFile(ImageOffset);
        break;
      }

      if (ImageOffset == FileSize) {
        // Upload Complete
        console.log("Upload Complete Send Validate With Apply")
        SendValidateImageCmd()
        break;
      }

      clearedToSend = false;
      console.log("ReSending from index : " + ImageOffset)
      //var Offset = new Uint8Array(toBytesInt32(ImageOffset, "little"));
      //var OTAUData = OTABuffer.slice(ImageOffset, ImageOffset + 200);
      //console.log("OTAUData : " + OTAUData);
      //await sleep(500);
      //  BLEBuf = mergeTypedArrays(Offset, OTAUData);
      //console.log(BLEBuf)
      //  await ImageWritechar.writeValue(BLEBuf);
      setTimeout(function() {console.log("Waiting Before sending again")}, 500);
      ReStartOTA(ImageOffset);
      break;
    default:
      console.log('> Received : Default Value')
  }
}

//Utils
function toBytesInt32(num, endian) {
  arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
  view = new DataView(arr);
  if (endian == "little") {
    view.setUint32(0, num, true); // byteOffset = 0; litteEndian = false
  } else {
    view.setUint32(0, num, false);
  }
  return arr;
}

function mergeTypedArrays(a, b) {
  // Checks for truthy values on both arrays
  if (!a && !b) throw 'Please specify valid arguments for parameters a and b.';

  // Checks for truthy values or empty arrays on each argument
  // to avoid the unnecessary construction of a new array and
  // the type comparison
  if (!b || b.length === 0) return a;
  if (!a || a.length === 0) return b;

  // Make sure that both typed arrays are of the same type
  if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b))
    throw 'The types of the two arguments passed for parameters a and b do not match.';

  var c = new a.constructor(a.length + b.length);
  c.set(a);
  c.set(b, a.length);

  return c;
}

function toHexString(byteArray) {
  var s = '0x';
  byteArray.forEach(function(byte) {
    s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
  });
  return s;
}

function padHex(value) {
  return ('00' + value.toString(16).toUpperCase()).slice(-2);
}


function getUsbVendorName(value) {
  // Check out page source to see what valueToUsbVendorName object is.
  return value +
    (value in valueToUsbVendorName ? ' (' + valueToUsbVendorName[value] + ')' : '');
}
