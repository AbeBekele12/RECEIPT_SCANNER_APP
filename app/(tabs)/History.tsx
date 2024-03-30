import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
import { Text, View, SafeAreaView, StatusBar, ScrollView, Button, Alert, Image, TouchableOpacity } from 'react-native';
import { launchImageLibraryAsync, launchCameraAsync, MediaTypeOptions, ImagePickerResult, ImagePickerSuccessResult, requestCameraPermissionsAsync } from 'expo-image-picker';
import { RNCamera } from 'react-native-camera';
import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';

const ReceiptScanner = () => {
    const cameraRef = useRef<RNCamera | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [recognizedText, setRecognizedText] = useState<string | null>(null);
    const [totalCost, setTotalCost] = useState<number | null>(null);

    useEffect(() => {
        if (image) {
            recognizeText();
        }
    }, [image]); // Run recognizeText when image changes

    const checkCameraPermissions = async () => {
        const { status } = await requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Camera permission not granted');
        }
    };

    const pickImage = async () => {
        await checkCameraPermissions();
        let result: ImagePickerResult | ImagePickerSuccessResult = await launchImageLibraryAsync({ mediaTypes: MediaTypeOptions.Images, quality: 0.8, base64: true });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].uri);
        }
    };

    const openCamera = async () => {
        await checkCameraPermissions();
        let result: ImagePickerResult | ImagePickerSuccessResult = await launchCameraAsync({ mediaTypes: MediaTypeOptions.Images, quality: 0.8, base64: true });
        if (!result.canceled && 'uri' in result) {
            setImage(result.uri as string);
        }
    };

    const recognizeText = async () => {
        if (image) {
            try {
                const visionResp: TextRecognitionResult = await TextRecognition.recognize(image);
                setRecognizedText(visionResp.text);
                const totalCostRegex = /Total: \$(\d+\.\d+)/;
                const match = visionResp.text.match(totalCostRegex);
                if (match) {
                    const costValue = parseFloat(match[1]);
                    setTotalCost(costValue);
                } else {
                    setTotalCost(null);
                    Alert.alert('Total cost not found in the receipt.');
                }
            } catch (error) {
                console.error('Error recognizing text:', error);
                Alert.alert('Error recognizing text');
            }
        }
    };

    const takePictureAndProcess = async () => {
        if (cameraRef.current) {
            try {
                const options = {
                    quality: 0.8,
                    base64: true,
                };
                const { uri } = await cameraRef.current.takePictureAsync(options);
                setImage(uri); // Set image URI to trigger recognition
            } catch (error) {
                console.error('Error taking and processing picture:', error);
                Alert.alert('Error taking and processing picture');
            }
        }
    };

    return (
        <SafeAreaView>
            <StatusBar barStyle="dark-content" />
            <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 64 }}>
                <Text>Receipt Scanner</Text>
                <View style={{ flexDirection: 'row', marginTop: 16 }}>
                    <Button title="Pick Image" onPress={pickImage} />
                    <Button title="Open Camera" onPress={openCamera} />
                    <TouchableOpacity onPress={takePictureAndProcess}>
                        <Text>Take Picture and Process</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    <View>
                        {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
                        {recognizedText !== null && <Text>Recognized Text: {recognizedText}</Text>}
                        {totalCost !== null && <Text>Total Cost: ${totalCost.toFixed(2)}</Text>}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default ReceiptScanner;
