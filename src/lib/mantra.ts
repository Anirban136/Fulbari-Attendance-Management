/**
 * Mantra MFS110 Fingerprint Scanner — Client-side Utility
 * 
 * Communicates with the Mantra RD (Registered Device) Service 
 * running locally on the user's machine via REST API.
 * 
 * The RD Service typically runs on ports 11100-11105.
 */

// Ports to scan for the Mantra RD Service
const RD_SERVICE_PORTS = [11100, 11101, 11102, 11103, 11104, 11105];
const CAPTURE_TIMEOUT_MS = 15000; // 15 seconds to place finger

/**
 * XML payload for fingerprint capture request.
 * fCount=1 : Capture 1 finger
 * fType=0  : FMR (Fingerprint Minutiae Record)
 * iCount=0 : No iris
 * pCount=0 : No face
 * format=0 : XML response format
 * pidVer=2.0 : PID version
 * timeout=15000 : Wait up to 15 seconds
 */
const CAPTURE_XML = `<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts fCount="1" fType="0" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="${CAPTURE_TIMEOUT_MS}" otp="" wadh="" posh="UNKNOWN" />
</PidOptions>`;

export interface DeviceInfo {
  status: 'READY' | 'NOT_READY' | 'NOT_FOUND' | 'BUSY';
  port: number | null;
  deviceName?: string;
  serialNo?: string;
  message: string;
}

export interface CaptureResult {
  success: boolean;
  pidData: string;       // Raw PidData XML block
  pidDataHash: string;   // SHA-256 hash of the biometric data for matching
  quality: number;       // Capture quality score
  errorCode?: string;
  errorMessage?: string;
  devicePort: number;
}

/**
 * Discover the Mantra RD Service by scanning known ports.
 * Returns device info if found.
 */
export async function discoverDevice(): Promise<DeviceInfo> {
  for (const port of RD_SERVICE_PORTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`http://127.0.0.1:${port}`, {
        method: 'RDSERVICE',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const xmlText = await response.text();

      // Parse the RD Service response XML
      if (xmlText.includes('READY') || xmlText.includes('ready')) {
        const statusMatch = xmlText.match(/status="([^"]+)"/i);
        const deviceMatch = xmlText.match(/dpId="([^"]+)"/i);
        const serialMatch = xmlText.match(/srno="([^"]+)"/i);
        
        return {
          status: 'READY',
          port,
          deviceName: deviceMatch?.[1] || 'Mantra MFS110',
          serialNo: serialMatch?.[1] || 'Unknown',
          message: 'Scanner is ready for capture',
        };
      } else if (xmlText.includes('NOTREADY') || xmlText.includes('notready')) {
        return {
          status: 'NOT_READY',
          port,
          message: 'Scanner found but not ready. Please reconnect the device.',
        };
      } else if (xmlText.includes('BUSY') || xmlText.includes('busy')) {
        return {
          status: 'BUSY',
          port,
          message: 'Scanner is busy with another operation. Please wait.',
        };
      }
    } catch {
      // Port not available, try next
      continue;
    }
  }

  return {
    status: 'NOT_FOUND',
    port: null,
    message: 'Mantra RD Service not detected. Please ensure the driver and RD Service are installed and running.',
  };
}

/**
 * Capture a fingerprint from the Mantra MFS110 scanner.
 * Must call discoverDevice() first to get the port.
 */
export async function captureFingerprint(port: number): Promise<CaptureResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS + 5000);

    const response = await fetch(`http://127.0.0.1:${port}/rd/capture`, {
      method: 'CAPTURE',
      headers: { 'Content-Type': 'text/xml' },
      body: CAPTURE_XML,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const xmlText = await response.text();

    // Parse the capture response
    const errorCodeMatch = xmlText.match(/errCode="([^"]+)"/i);
    const errorInfoMatch = xmlText.match(/errInfo="([^"]+)"/i);
    const errorCode = errorCodeMatch?.[1] || '0';
    
    if (errorCode !== '0') {
      return {
        success: false,
        pidData: '',
        pidDataHash: '',
        quality: 0,
        errorCode,
        errorMessage: errorInfoMatch?.[1] || 'Capture failed',
        devicePort: port,
      };
    }

    // Extract quality score
    const qualityMatch = xmlText.match(/qScore="([^"]+)"/i);
    const quality = qualityMatch ? parseInt(qualityMatch[1], 10) : 0;

    // Generate a hash of the PidData for matching
    const pidDataHash = await hashPidData(xmlText);

    return {
      success: true,
      pidData: xmlText,
      pidDataHash,
      quality,
      devicePort: port,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      pidData: '',
      pidDataHash: '',
      quality: 0,
      errorMessage: message.includes('abort') 
        ? 'Capture timed out. Please place your finger on the scanner.' 
        : `Scanner communication error: ${message}`,
      devicePort: port,
    };
  }
}

/**
 * Hash the PidData content for use as a fingerprint identifier.
 * We extract the core biometric data portion and hash it.
 */
async function hashPidData(xmlText: string): Promise<string> {
  // Extract the Data element content (which contains the actual biometric data)
  const dataMatch = xmlText.match(/<Data[^>]*>([\s\S]*?)<\/Data>/i);
  const pidBlockMatch = xmlText.match(/<Resp[^>]*\/>[\s\S]*$/i);
  
  // Use the entire PID data block for consistent hashing
  const contentToHash = dataMatch?.[1] || pidBlockMatch?.[0] || xmlText;
  
  // Use Web Crypto API for SHA-256 hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(contentToHash.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
