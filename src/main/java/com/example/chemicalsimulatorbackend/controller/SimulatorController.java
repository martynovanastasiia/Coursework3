// SimulatorController.java
package com.example.chemicalsimulatorbackend.controller;

import com.example.chemicalsimulatorbackend.model.Tank;
import com.example.chemicalsimulatorbackend.service.SimulatorService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
@CrossOrigin(origins = "*")
public class SimulatorController {

    private final SimulatorService simulatorService;

    public SimulatorController(SimulatorService simulatorService) {
        this.simulatorService = simulatorService;
    }

    @GetMapping("/status")
    public Map<String, Object> getStatus(@RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        Map<String, Object> response = new HashMap<>();

        // Отримуємо стан симулятора САМЕ ДЛЯ ЦЬОГО користувача
        SimulatorService.SimulatorState state = simulatorService.getStatus(sessionId);

        response.put("processState",    state.getProcessState());
        response.put("isPaused",        state.isPaused());
        response.put("currentRecipe",   state.getCurrentRecipe());
        response.put("currentStepIndex",state.getCurrentStepIndex());
        response.put("totalSteps",      state.getTotalProcessSteps());
        response.put("stepProgress",    state.getStepProgress());
        response.put("eventLog",        state.getEventLog());

        response.put("oilTank",      extractTankData(state.getLeftTank()));
        response.put("lyeTank",      extractTankData(state.getRightTank()));
        response.put("reactorTank",  extractTankData(state.getReactorTank()));

        return response;
    }

    @PostMapping("/start")
    public Map<String, String> startProcess(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestParam String recipe) {
        simulatorService.startProcess(sessionId, recipe);
        return Map.of("status", "started", "recipe", recipe);
    }

    @PostMapping("/pause")
    public Map<String, String> togglePause(@RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        simulatorService.togglePause(sessionId);
        return Map.of("status", "paused_toggled");
    }

    @PostMapping("/reset")
    public Map<String, String> resetProcess(@RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        simulatorService.resetProcess(sessionId);
        return Map.of("status", "reset");
    }

    @PostMapping("/tick")
    public void processTick(@RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        simulatorService.processTick(sessionId);
    }

    private Map<String, Object> extractTankData(Tank tank) {
        Map<String, Object> data = new HashMap<>();
        data.put("currentLevel",    tank.getCurrentLevel());
        data.put("heaterOn",        tank.isHeaterOn());
        data.put("mixerOn",         tank.isMixerOn());
        data.put("temperature",     Math.round(tank.getTemperature() * 10.0) / 10.0);
        data.put("targetTemp",      tank.getTargetTemperature());
        data.put("inputValveOpen",  tank.getInputValve().isOpen());
        data.put("outputValveOpen", tank.getOutputValve().isOpen());
        data.put("lowSensor",       tank.isLowLevelSensorTriggered());
        data.put("highSensor",      tank.isHighLevelSensorTriggered());
        return data;
    }
}