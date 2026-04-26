//Valve.java
package com.example.chemicalsimulatorbackend.model;

public class Valve {
    private boolean isOpen;

    public Valve() {
        this.isOpen = false; // За замовчуванням кран закритий
    }

    public boolean isOpen() {
        return isOpen;
    }

    // Подача сигналу (низький рівень - true, високий - false)
    public void setControlSignal(boolean lowLevelSignal) {
        this.isOpen = lowLevelSignal;
    }
}
