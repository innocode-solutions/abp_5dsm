from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_health_check_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()

    assert payload["status"] == "OK"
    assert "services" in payload
    assert set(payload["services"].keys()) == {"dropout_service", "prediction_service"}


def test_predict_performance_success():
    payload = {
        "Hours_Studied": 6.0,
        "Previous_Scores": 85.0,
        "Sleep_Hours": 8.0,
        "Distance_from_Home": "Near",
        "Attendance": 95.0,
        "Gender": "Male",
        "Parental_Education_Level": "Bachelor's",
        "Parental_Involvement": "High",
        "School_Type": "Public",
        "Peer_Influence": "Positive",
        "Extracurricular_Activities": "Yes",
        "Learning_Disabilities": "No",
        "Internet_Access": "Yes",
        "Access_to_Resources": "Good",
        "Teacher_Quality": "Good",
        "Family_Income": "High",
        "Motivation_Level": "High",
        "Tutoring_Sessions": "No",
        "Physical_Activity": "High"
    }

    response = client.post("/predict/performance", json=payload)

    assert response.status_code == 200
    body = response.json()

    assert "approval_status" in body
    assert "confidence" in body
    assert "factors" in body and isinstance(body["factors"], list)
    assert body["saved"] is False


def test_predict_dropout_success():
    payload = {
        "raisedhands": 50,
        "VisITedResources": 80,
        "AnnouncementsView": 90,
        "Discussion": 35,
        "ParentAnsweringSurvey": "Yes",
        "ParentschoolSatisfaction": "Good",
        "StudentAbsenceDays": "Under-7"
    }

    response = client.post("/predict/dropout", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert "class_dropout" in data
    assert "probability_dropout" in data
    assert "explain" in data

