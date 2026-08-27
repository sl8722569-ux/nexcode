package creations.insan.nexcode;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.os.Build;

public class MainActivity extends Activity {
  private WebView web;
  private static final int REQ = 42;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setStatusBarColor(0xFF1E1E1E);
    web = new WebView(this);
    web.setBackgroundColor(0xFF1E1E1E);
    setContentView(web);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(true);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    if (Build.VERSION.SDK_INT >= 21) {
      s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
    web.setWebViewClient(new WebViewClient());
    web.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> request.grant(request.getResources()));
      }
    });
    web.setDownloadListener((url, ua, cd, mime, len) -> {
      try {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        startActivity(i);
      } catch (Exception ignored) {}
    });
    requestPermissions(new String[] {
      Manifest.permission.CAMERA,
      Manifest.permission.RECORD_AUDIO
    }, REQ);
    web.loadUrl(BuildConfig.WEB_URL);
  }

  @Override
  public void onBackPressed() {
    if (web.canGoBack()) web.goBack();
    else super.onBackPressed();
  }

  @Override
  public void onRequestPermissionsResult(int c, String[] p, int[] r) {
    /* WebView will request again if needed */
  }
}
