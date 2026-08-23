package com.osdevscape.readquest;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Size;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class IsbnScannerActivity extends AppCompatActivity {

    public static final String EXTRA_ISBN = "isbn";

    private PreviewView cameraPreview;
    private TextView scanStatusText;
    private Button torchButton;
    private ExecutorService cameraExecutor;
    private BarcodeScanner barcodeScanner;
    private Camera camera;
    private boolean scanComplete = false;
    private boolean torchEnabled = false;

    private final ActivityResultLauncher<String> cameraPermissionLauncher =
            registerForActivityResult(
                    new ActivityResultContracts.RequestPermission(),
                    granted -> {
                        if (granted) {
                            startCamera();
                        } else {
                            Toast.makeText(
                                    this,
                                    "Camera permission is required to scan an ISBN.",
                                    Toast.LENGTH_LONG
                            ).show();
                            finishCancelled();
                        }
                    }
            );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_isbn_scanner);

        cameraPreview = findViewById(R.id.cameraPreview);
        scanStatusText = findViewById(R.id.scanStatusText);
        torchButton = findViewById(R.id.torchButton);

        Button closeScannerButton = findViewById(R.id.closeScannerButton);
        closeScannerButton.setOnClickListener(view -> finishCancelled());

        torchButton.setOnClickListener(view -> toggleTorch());
        torchButton.setEnabled(false);

        cameraExecutor = Executors.newSingleThreadExecutor();

        BarcodeScannerOptions options =
                new BarcodeScannerOptions.Builder()
                        .setBarcodeFormats(
                                Barcode.FORMAT_EAN_13,
                                Barcode.FORMAT_EAN_8,
                                Barcode.FORMAT_UPC_A,
                                Barcode.FORMAT_UPC_E
                        )
                        .build();

        barcodeScanner = BarcodeScanning.getClient(options);

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            startCamera();
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
        }
    }

    private void startCamera() {
        scanStatusText.setText("Starting camera…");

        ListenableFuture<ProcessCameraProvider> cameraProviderFuture =
                ProcessCameraProvider.getInstance(this);

        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();

                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(cameraPreview.getSurfaceProvider());

                ImageAnalysis imageAnalysis =
                        new ImageAnalysis.Builder()
                                .setTargetResolution(new Size(1280, 720))
                                .setBackpressureStrategy(
                                        ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST
                                )
                                .build();

                imageAnalysis.setAnalyzer(
                        cameraExecutor,
                        new ImageAnalysis.Analyzer() {
                            @Override
                            @androidx.camera.core.ExperimentalGetImage
                            public void analyze(
                                    @NonNull androidx.camera.core.ImageProxy imageProxy
                            ) {
                                IsbnScannerActivity.this.analyzeImage(imageProxy);
                            }
                        }
                );

                CameraSelector cameraSelector =
                        new CameraSelector.Builder()
                                .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                                .build();

                cameraProvider.unbindAll();

                camera = cameraProvider.bindToLifecycle(
                        this,
                        cameraSelector,
                        preview,
                        imageAnalysis
                );

                runOnUiThread(() -> {
                    scanStatusText.setText("Searching for an ISBN barcode…");

                    if (camera.getCameraInfo().hasFlashUnit()) {
                        torchButton.setEnabled(true);
                    } else {
                        torchButton.setText("No light");
                        torchButton.setEnabled(false);
                    }
                });

            } catch (ExecutionException | InterruptedException exception) {
                runOnUiThread(() -> {
                    scanStatusText.setText("Unable to start the camera.");
                    Toast.makeText(
                            this,
                            "Unable to start the camera.",
                            Toast.LENGTH_LONG
                    ).show();
                });

                finishCancelled();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void toggleTorch() {
        if (camera == null || !camera.getCameraInfo().hasFlashUnit()) {
            return;
        }

        torchEnabled = !torchEnabled;
        camera.getCameraControl().enableTorch(torchEnabled);

        torchButton.setText(torchEnabled ? "Light off" : "Light");
        torchButton.setContentDescription(
                torchEnabled
                        ? "Turn flashlight off"
                        : "Turn flashlight on"
        );
    }

    @androidx.camera.core.ExperimentalGetImage
    private void analyzeImage(
            @NonNull androidx.camera.core.ImageProxy imageProxy
    ) {
        if (scanComplete) {
            imageProxy.close();
            return;
        }

        android.media.Image mediaImage = imageProxy.getImage();

        if (mediaImage == null) {
            imageProxy.close();
            return;
        }

        InputImage image = InputImage.fromMediaImage(
                mediaImage,
                imageProxy.getImageInfo().getRotationDegrees()
        );

        barcodeScanner.process(image)
                .addOnSuccessListener(this::handleBarcodes)
                .addOnCompleteListener(task -> imageProxy.close());
    }

    private void handleBarcodes(List<Barcode> barcodes) {
        if (scanComplete || barcodes.isEmpty()) {
            return;
        }

        Barcode firstBarcode = barcodes.get(0);
        String rawValue = firstBarcode.getRawValue();

        runOnUiThread(() -> {
            if (!scanComplete) {
                scanStatusText.setText("Barcode detected. Checking ISBN…");
            }
        });

        for (Barcode barcode : barcodes) {
            String barcodeValue = barcode.getRawValue();

            if (barcodeValue == null) {
                continue;
            }

            String isbn = normalizeIsbn(barcodeValue);

            if (isbn != null) {
                scanComplete = true;

                runOnUiThread(() -> {
                    scanStatusText.setText("ISBN found. Opening book details…");
                    returnIsbn(isbn);
                });

                return;
            }
        }

        if (rawValue != null) {
            runOnUiThread(() -> {
                if (!scanComplete) {
                    scanStatusText.setText(
                            "Barcode detected, but it is not an ISBN. " +
                            "Try the barcode above the ISBN number."
                    );
                }
            });
        }
    }

    private String normalizeIsbn(String barcodeValue) {
    String value = barcodeValue
            .replaceAll("[^0-9Xx]", "")
            .toUpperCase();

    // Current Bookland ISBN-13 / EAN-13 barcode.
    if (value.length() == 13
            && (value.startsWith("978") || value.startsWith("979"))
            && isValidIsbn13(value)) {
        return value;
    }

    // Some scanners present a Bookland EAN-13 code as a 12-digit UPC-A
    // value by dropping its leading zero.
    if (value.length() == 12
            && (value.startsWith("978") || value.startsWith("979"))
            && isValidIsbn13("0" + value)) {
        return "0" + value;
    }

    // Older book barcodes can carry ISBN-10 directly.
    // Convert valid ISBN-10 to its ISBN-13 form for the lookup.
    if (value.length() == 10 && isValidIsbn10(value)) {
        return isbn10ToIsbn13(value);
    }

    return null;
}

private boolean isValidIsbn10(String isbn) {
    if (!isbn.matches("[0-9]{9}[0-9X]")) {
        return false;
    }

    int total = 0;

    for (int index = 0; index < 10; index++) {
        char character = isbn.charAt(index);
        int digit = character == 'X' ? 10 : character - '0';
        total += digit * (10 - index);
    }

    return total % 11 == 0;
}

private boolean isValidIsbn13(String isbn) {
    if (!isbn.matches("[0-9]{13}")) {
        return false;
    }

    int total = 0;

    for (int index = 0; index < 13; index++) {
        int digit = isbn.charAt(index) - '0';
        total += digit * (index % 2 == 0 ? 1 : 3);
    }

    return total % 10 == 0;
}

private String isbn10ToIsbn13(String isbn10) {
    String firstTwelveDigits = "978" + isbn10.substring(0, 9);
    int total = 0;

    for (int index = 0; index < firstTwelveDigits.length(); index++) {
        int digit = firstTwelveDigits.charAt(index) - '0';
        total += digit * (index % 2 == 0 ? 1 : 3);
    }

    int checkDigit = (10 - (total % 10)) % 10;

    return firstTwelveDigits + checkDigit;
}

    private void returnIsbn(String isbn) {
        Intent resultIntent = new Intent();
        resultIntent.putExtra(EXTRA_ISBN, isbn);
        setResult(RESULT_OK, resultIntent);
        finish();
    }

    private void finishCancelled() {
        setResult(RESULT_CANCELED);
        finish();
    }

    @Override
    protected void onDestroy() {
        if (camera != null && torchEnabled) {
            camera.getCameraControl().enableTorch(false);
        }

        if (barcodeScanner != null) {
            barcodeScanner.close();
        }

        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
        }

        super.onDestroy();
    }
}