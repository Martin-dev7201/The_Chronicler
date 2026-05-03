import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web - '
        'you can reconfigure this by running the FlutterFire CLI again.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.android:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for android.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBPW-LPWrfNYrl_3ZhG8_Ai-8Lgy1yAdrw',
    appId: '1:227755250375:ios:56db29f94c8f5dd476e4e2',
    messagingSenderId: '227755250375',
    projectId: 'vinyl-hube-9383f',
    storageBucket: 'vinyl-hube-9383f.firebasestorage.app',
    iosBundleId: 'com.example.flutterApplication1',
  );
}