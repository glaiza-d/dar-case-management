# Generated migration to add case_type field to Case model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_caseactivity_delete_caseworkflow'),
    ]

    operations = [
        migrations.AddField(
            model_name='case',
            name='case_type',
            field=models.CharField(
                choices=[
                    ('Inquiry', 'Inquiry'),
                    ('Mediation', 'Mediation'),
                    ('Communication', 'Communication'),
                    ('Stakeholders', 'Stakeholders'),
                    ('Transmittal HR', 'Transmittal HR'),
                    ('Transmittal PBDD', 'Transmittal PBDD'),
                    ('Transmittal LTID', 'Transmittal LTID'),
                ],
                default='Inquiry',
                db_index=True,
                max_length=50
            ),
        ),
    ]
