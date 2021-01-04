---
layout: post
title: Microsoft Edge TLS Related Issue
categories: Browsers
description: 
keywords: TLS,Cipher,ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY,ERR_SPDY_INADEQUATE_TRANSPORT_SECURITY,ERR_CERT_WAK_SIGNATURE_ALGORITHM,CERT_STATUS_WEAK_SIGNATURE_ALGORITHM,Microsoft Edge,Edge,Chrome,Chromuim
---

Recently we got several TLS related issues on Microsoft Edge. Those issues also can be reproduced on Chrome and IE11 works well.

- Microsoft Edge failed to access internal website with error "ERR_SPDY_INADEQUATE_TRANSPORT_SECURITY". IE11 works well. And Microsoft Edge works well with fiddler trace.

- Microsoft Edge failed to access internal website with error "ERR_CERT_WAK_SIGNATURE_ALGORITHM". IE11 works well. We have put root certificate to "trusted Root Certificate" in cert store.

## ERR_SPDY_INADEQUATE_TRANSPORT_SECURITY

For the error of ERR_SPDY_INADEQUATE_TRANSPORT_SECURITY, we can check the error in edge://net-exports and we will find out that the real error code is ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY. See the net_error in below logs:

```log
t=47212 [st= 1]      NETWORK_DELEGATE_BEFORE_START_TRANSACTION  [dt=0]
t=47212 [st= 1]      HTTP_CACHE_GET_BACKEND  [dt=0]
t=47212 [st= 1]      HTTP_CACHE_OPEN_OR_CREATE_ENTRY  [dt=1]
t=47213 [st= 2]      HTTP_CACHE_ADD_TO_ENTRY  [dt=0]
t=47213 [st= 2]     +HTTP_STREAM_REQUEST  [dt=41]
t=47213 [st= 2]        HTTP_STREAM_JOB_CONTROLLER_BOUND
                       --> source_dependency = 3628 (HTTP_STREAM_JOB_CONTROLLER)
t=47254 [st=43]        HTTP_STREAM_REQUEST_BOUND_TO_JOB
                       --> source_dependency = 3629 (HTTP_STREAM_JOB)
t=47254 [st=43]     -HTTP_STREAM_REQUEST
t=47254 [st=43]   -URL_REQUEST_START_JOB
                   --> net_error = -360 (ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY)
t=47254 [st=43]    URL_REQUEST_DELEGATE_RESPONSE_STARTED  [dt=0]
t=47254 [st=43] -REQUEST_ALIVE
                 --> net_error = -360 (ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY)
```

If we search ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY in [Chromuim Source Code](https://source.chromium.org/), we will get below code.

```cpp
  if (!spdy_session->HasAcceptableTransportSecurity()) {
    spdy_session->CloseSessionOnError(ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY,
                                      "");
    return ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY;
  }
```

So we should check the definition of function HasAcceptableTransportSecurity:

```cpp
bool SpdySession::HasAcceptableTransportSecurity() const {
  SSLInfo ssl_info;
  CHECK(GetSSLInfo(&ssl_info));

  // HTTP/2 requires TLS 1.2+
  if (SSLConnectionStatusToVersion(ssl_info.connection_status) <
      SSL_CONNECTION_VERSION_TLS1_2) {
    return false;
  }

  if (!IsTLSCipherSuiteAllowedByHTTP2(
          SSLConnectionStatusToCipherSuite(ssl_info.connection_status))) {
    return false;
  }

  return true;
}
```

We know that the SSL protocol should be TLS 1.2+ and the Cipher Suite should be allowed by HTTP2.Then we can analyze the network package and figure out the SSL protocol and Cipher Suite.

If the SSL protocol is less than TLS 1.2 or the Cipher suite is in the list of [TLS 1.2 Cipher Suite Black List](https://tools.ietf.org/html/rfc7540#appendix-A), then we will get the error ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY.

> Notes:
>
> [End-users should complain to the server operators, and can work around the problem by closing all instances of Edge then restarting with a commandline argument msedge.exe –disable-http2 to disable support for the faster network protocol.](https://textslashplain.com/2019/05/01/edge-76-vs-edge-18-vs-chrome/)

## ERR_CERT_WAK_SIGNATURE_ALGORITHM

For this error, we can reproduce the issue with [Bad SSL SHA1-2016](https://sha1-2016.badssl.com/). We can also check the log in edge://net-exports. Below is the snapshot:

```log
89279: URL_REQUEST
https://sha1-2016.badssl.com/
Start Time: 2021-01-04 17:28:51.011

t=39220 [st=  0] +REQUEST_ALIVE  [dt=530]
                  --> priority = "HIGHEST"
                  --> traffic_annotation = 63171670
                  --> url = "https://sha1-2016.badssl.com/"
t=39220 [st=  0]    NETWORK_DELEGATE_BEFORE_URL_REQUEST  [dt=0]
t=39221 [st=  1]   +URL_REQUEST_START_JOB  [dt=529]
                    --> initiator = "not an origin"
                    --> load_flags = 65792 (CAN_USE_RESTRICTED_PREFETCH | MAIN_FRAME_DEPRECATED)
                    --> method = "GET"
                    --> network_isolation_key = "https://badssl.com https://badssl.com"
                    --> privacy_mode = "disabled"
                    --> site_for_cookies = "SiteForCookies: {scheme=https; registrable_domain=badssl.com; schemefully_same=true}"
                    --> url = "https://sha1-2016.badssl.com/"
t=39221 [st=  1]      NETWORK_DELEGATE_BEFORE_START_TRANSACTION  [dt=0]
t=39222 [st=  2]      HTTP_CACHE_GET_BACKEND  [dt=0]
t=39222 [st=  2]      HTTP_CACHE_OPEN_OR_CREATE_ENTRY  [dt=1]
t=39223 [st=  3]      HTTP_CACHE_ADD_TO_ENTRY  [dt=0]
t=39223 [st=  3]     +HTTP_STREAM_REQUEST  [dt=524]
t=39223 [st=  3]        HTTP_STREAM_JOB_CONTROLLER_BOUND
                        --> source_dependency = 89281 (HTTP_STREAM_JOB_CONTROLLER)
t=39747 [st=527]        HTTP_STREAM_REQUEST_BOUND_TO_JOB
                        --> source_dependency = 89282 (HTTP_STREAM_JOB)
t=39747 [st=527]     -HTTP_STREAM_REQUEST
t=39747 [st=527]      URL_REQUEST_DELEGATE_SSL_CERTIFICATE_ERROR  [dt=2]
t=39749 [st=529]      CANCELLED
                      --> net_error = -208 (ERR_CERT_WEAK_SIGNATURE_ALGORITHM)
t=39750 [st=530]   -URL_REQUEST_START_JOB
                    --> net_error = -208 (ERR_CERT_WEAK_SIGNATURE_ALGORITHM)
t=39750 [st=530]    URL_REQUEST_DELEGATE_RESPONSE_STARTED  [dt=0]
t=39750 [st=530] -REQUEST_ALIVE
                  --> net_error = -208 (ERR_CERT_WEAK_SIGNATURE_ALGORITHM)
```

Then we should check the source code of chomuim and search error of ERR_CERT_WEAK_SIGNATURE_ALGORITHM in [Chromuim Source Code](https://source.chromium.org/), we will get below code.

```cpp
// net/cert/cert_status_flags.cc
CertStatus MapNetErrorToCertStatus(int error) {
  switch (error) {
……
    case ERR_CERT_WEAK_SIGNATURE_ALGORITHM:
      return CERT_STATUS_WEAK_SIGNATURE_ALGORITHM;
    ……
  }
……
}

// net/cert/cert_verify_proc.cc
int CertVerifyProc::Verify(X509Certificate* cert,
                           const std::string& hostname,
                           const std::string& ocsp_response,
                           const std::string& sct_list,
                           int flags,
                           CRLSet* crl_set,
                           const CertificateList& additional_trust_anchors,
                           CertVerifyResult* verify_result,
                           const NetLogWithSource& net_log) {
……
  if (verify_result->has_sha1)
    verify_result->cert_status |= CERT_STATUS_SHA1_SIGNATURE_PRESENT;

  // Flag certificates using weak signature algorithms.

  // Current SHA-1 behaviour:
  // - Reject all SHA-1
  // - ... unless it's not publicly trusted and SHA-1 is allowed
  // - ... or SHA-1 is in the intermediate and SHA-1 intermediates are
  //   allowed for that platform. See https://crbug.com/588789
  bool current_sha1_issue =
      (verify_result->is_issued_by_known_root ||
       !(flags & VERIFY_ENABLE_SHA1_LOCAL_ANCHORS)) &&
      (verify_result->has_sha1_leaf ||
       (verify_result->has_sha1 && !AreSHA1IntermediatesAllowed()));

  if (verify_result->has_md5 || current_sha1_issue) {
    verify_result->cert_status |= CERT_STATUS_WEAK_SIGNATURE_ALGORITHM;
    // Avoid replacing a more serious error, such as an OS/library failure,
    // by ensuring that if verification failed, it failed with a certificate
    // error.
    if (rv == OK || IsCertificateError(rv))
      rv = MapCertStatusToNetError(verify_result->cert_status);
  }
  ……
}
```

From the code, we know that ERR_CERT_WEAK_SIGNATURE_ALGORITHM equals to CERT_STATUS_WEAK_SIGNATURE_ALGORITHM. And from the code of CertVerifyProc::Verify, Microsoft Edge and Chrome will block legacy SHA1 and MD5 Hash algorithms. Acturally from Edge79 and Chrome do not allow server certificate chains that contain SHA-1 signatures. Edge Legacy and IE permit SHA-1 in chains that certificates that chain to a local/enterprise root. A policy added in Edge 86 temporarily allow SHA-1 chains. Check the information in [Edge79+ vs. Edge18 vs. Chrome section:HTTPS – Certificates](https://textslashplain.com/2019/05/01/edge-76-vs-edge-18-vs-chrome/)

> Reference:
>
> - [How to capture a NetLog dump](https://dev.chromium.org/for-testers/providing-network-details)
> - [Chromium Source Code](https://source.chromium.org/chromium)
> - [Edge79+ vs. Edge18 vs. Chrome](https://textslashplain.com/2019/05/01/edge-76-vs-edge-18-vs-chrome/)